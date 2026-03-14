"use server";

import { revalidatePath } from "next/cache";

import { getResendClient } from "@/lib/email/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl, getResendFromEmail } from "@/lib/supabase/env";
import { isStaffRole } from "@/lib/auth/roles";
import { applyDefaultFees, ensureDefaultPricingSetup } from "@/lib/pricing/calculator";
import {
  pricingProductSchema,
  rateLockSchema,
  rateSheetSchema,
  recalculatePricingSchema,
} from "@/lib/validations/pricing";
import type { ActionResult } from "@/types/auth";

function adminClient() {
  return createSupabaseAdminClient();
}

function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function revalidatePricingPaths(loanId?: string, productId?: string) {
  revalidatePath("/admin/settings/products");
  if (productId) {
    revalidatePath(`/admin/settings/products/${productId}`);
    revalidatePath(`/admin/settings/products/${productId}/rates`);
  }
  if (loanId) {
    revalidatePath(`/staff/loans/${loanId}`);
    revalidatePath(`/staff/loans/${loanId}/pricing`);
    revalidatePath(`/borrower/loans/${loanId}`);
  }
}

async function requireAdminContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to continue.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, role, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    throw new Error("Admin access is required.");
  }

  return { supabase, profile };
}

async function requireStaffContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to continue.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, role, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || (!isStaffRole(profile.role) && profile.role !== "admin")) {
    throw new Error("Staff access is required.");
  }

  return { supabase, profile };
}

async function writeAuditLog(params: {
  organizationId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  afterState?: object;
}) {
  await adminClient().from("audit_logs").insert({
    organization_id: params.organizationId,
    actor_id: params.actorId,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    after_state: params.afterState ?? {},
  });
}

export async function saveLoanProduct(
  values: Parameters<typeof pricingProductSchema.parse>[0],
): Promise<ActionResult<void>> {
  try {
    const payload = pricingProductSchema.parse(values);
    const { profile } = await requireAdminContext();
    await ensureDefaultPricingSetup(profile.organization_id);

    const guidelines = JSON.parse(payload.guidelines_json);
    const { data, error } = await adminClient()
      .from("loan_products")
      .upsert(
        {
          id: payload.id,
          organization_id: profile.organization_id,
          name: payload.name,
          loan_type: payload.loan_type,
          term_months: payload.term_months,
          amortization_type: payload.amortization_type,
          description: payload.description ?? null,
          is_active: payload.is_active,
          display_order: payload.display_order,
          guidelines,
        },
        { onConflict: "id" },
      )
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Unable to save the loan product.");
    }

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "pricing.product_saved",
      resourceType: "loan_product",
      resourceId: data.id,
      afterState: {
        name: payload.name,
        loan_type: payload.loan_type,
      },
    });

    revalidatePricingPaths(undefined, data.id);
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function saveRateSheet(
  values: Parameters<typeof rateSheetSchema.parse>[0],
): Promise<ActionResult<void>> {
  try {
    const payload = rateSheetSchema.parse(values);
    const { profile } = await requireAdminContext();
    const rateData = JSON.parse(payload.rate_data_json);
    const { data: product, error: productError } = await adminClient()
      .from("loan_products")
      .select("id, organization_id")
      .eq("id", payload.loan_product_id)
      .single();

    if (productError || !product || product.organization_id !== profile.organization_id) {
      throw new Error(productError?.message ?? "Product not found.");
    }

    if (payload.is_active) {
      await adminClient()
        .from("rate_sheets")
        .update({ is_active: false })
        .eq("loan_product_id", payload.loan_product_id)
        .eq("organization_id", profile.organization_id)
        .is("deleted_at", null);
    }

    const { data, error } = await adminClient()
      .from("rate_sheets")
      .upsert(
        {
          id: payload.id,
          organization_id: profile.organization_id,
          loan_product_id: payload.loan_product_id,
          effective_date: payload.effective_date,
          expiry_date: payload.expiry_date || null,
          margin: payload.margin,
          is_active: payload.is_active,
          rate_data: rateData,
        },
        { onConflict: "id" },
      )
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Unable to save the rate sheet.");
    }

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "pricing.rate_sheet_saved",
      resourceType: "rate_sheet",
      resourceId: data.id,
      afterState: {
        loan_product_id: payload.loan_product_id,
        effective_date: payload.effective_date,
      },
    });

    revalidatePricingPaths(undefined, payload.loan_product_id);
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function recalculateLoanPricing(loanId: string): Promise<ActionResult<void>> {
  try {
    const payload = recalculatePricingSchema.parse({ loanId });
    const { profile } = await requireStaffContext();
    const { data: loan, error } = await adminClient()
      .from("loan_applications")
      .select("id, organization_id, loan_type")
      .eq("id", payload.loanId)
      .single();

    if (error || !loan || loan.organization_id !== profile.organization_id) {
      throw new Error(error?.message ?? "Loan not found.");
    }

    await applyDefaultFees(payload.loanId, loan.loan_type);
    revalidatePricingPaths(payload.loanId);
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function lockRate(
  values: Parameters<typeof rateLockSchema.parse>[0],
): Promise<ActionResult<void>> {
  try {
    const payload = rateLockSchema.parse(values);
    const { profile } = await requireStaffContext();
    const { data: loan, error: loanError } = await adminClient()
      .from("loan_applications")
      .select("id, organization_id, borrower_id, loan_number, status")
      .eq("id", payload.loanId)
      .single();

    if (loanError || !loan || loan.organization_id !== profile.organization_id) {
      throw new Error(loanError?.message ?? "Loan not found.");
    }

    const lockExpiration = new Date(Date.now() + payload.lockPeriodDays * 24 * 60 * 60 * 1000).toISOString();
    const { error: lockError } = await adminClient().from("rate_locks").insert({
      loan_application_id: payload.loanId,
      loan_product_id: payload.loanProductId,
      locked_by: profile.id,
      rate: payload.rate,
      apr: payload.apr,
      points: payload.points,
      lock_period_days: payload.lockPeriodDays,
      expires_at: lockExpiration,
      status: "active",
    });

    if (lockError) {
      throw new Error(lockError.message);
    }

    if (["submitted", "underwriting"].includes(loan.status)) {
      await adminClient()
        .from("loan_applications")
        .update({ status: "processing" })
        .eq("id", payload.loanId);
    }

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "pricing.rate_locked",
      resourceType: "loan_application",
      resourceId: payload.loanId,
      afterState: {
        rate: payload.rate,
        apr: payload.apr,
        lock_period_days: payload.lockPeriodDays,
      },
    });

    const borrowerUser = await adminClient().auth.admin.getUserById(loan.borrower_id);
    const borrowerEmail = borrowerUser.data.user?.email;

    if (borrowerEmail && process.env.RESEND_API_KEY) {
      try {
        const resend = getResendClient();
        await resend.emails.send({
          from: getResendFromEmail(),
          to: borrowerEmail,
          subject: `Rate lock confirmed for ${loan.loan_number ?? payload.loanId}`,
          html: `
            <p>Your mortgage rate has been locked.</p>
            <p>Rate: ${payload.rate}% APR: ${payload.apr}%</p>
            <p>Lock expires on ${new Date(lockExpiration).toLocaleDateString()}.</p>
            <p>Track your loan at <a href="${getAppUrl()}/borrower/loans/${payload.loanId}">${getAppUrl()}/borrower/loans/${payload.loanId}</a></p>
          `,
        });
      } catch {
        // Best-effort transactional email.
      }
    }

    revalidatePricingPaths(payload.loanId, payload.loanProductId);
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}
