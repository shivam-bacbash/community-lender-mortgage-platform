"use server";

import { revalidatePath } from "next/cache";

import { buildHMDAInput } from "@/lib/compliance/hmda";
import { calculateDisclosureDeadline } from "@/lib/compliance/trid";
import { checkQMEligibility, getAporBaseline } from "@/lib/compliance/qm";
import { createNotification } from "@/lib/notifications/service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/supabase/env";
import type { ActionResult } from "@/types/auth";
import type { QMResult } from "@/types/compliance";

function adminClient() {
  return createSupabaseAdminClient();
}

function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
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

  if (
    profileError ||
    !profile ||
    !["loan_officer", "processor", "underwriter", "admin"].includes(profile.role)
  ) {
    throw new Error("Staff access is required.");
  }

  return { supabase, profile };
}

async function getProfileName(profileId: string) {
  const { data } = await adminClient()
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", profileId)
    .maybeSingle();

  return data ? `${data.first_name} ${data.last_name}`.trim() : "Borrower";
}

export async function computeQMForLoan(
  loanId: string,
  overrides?: { dti?: number | null },
): Promise<QMResult> {
  const [loanResult, rateLockResult, latestDecisionResult, productResult] = await Promise.all([
    adminClient()
      .from("loan_applications")
      .select("id, loan_type, loan_amount, term_months")
      .eq("id", loanId)
      .single(),
    adminClient()
      .from("rate_locks")
      .select("apr, points, loan_product_id")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("locked_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminClient()
      .from("underwriting_decisions")
      .select("dti_ratio")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("decided_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminClient().from("loan_products").select("id, amortization_type").is("deleted_at", null),
  ]);

  if (loanResult.error || !loanResult.data) {
    throw new Error(loanResult.error?.message ?? "Loan not found.");
  }

  const amortizationType =
    productResult.data?.find((item) => item.id === rateLockResult.data?.loan_product_id)?.amortization_type ??
    "fixed";

  return checkQMEligibility({
    dti: overrides?.dti ?? latestDecisionResult.data?.dti_ratio ?? null,
    points:
      rateLockResult.data?.points !== null && rateLockResult.data?.points !== undefined
        ? Number(rateLockResult.data.points)
        : null,
    termMonths: loanResult.data.term_months ?? 360,
    amortizationType,
    loanAmount: loanResult.data.loan_amount ?? null,
    apr:
      rateLockResult.data?.apr !== null && rateLockResult.data?.apr !== undefined
        ? Number(rateLockResult.data.apr)
        : null,
    apor: getAporBaseline(loanResult.data.loan_type),
  });
}

export async function upsertHMDARecordForLoan(loanId: string, denialReasons?: number[] | null) {
  const [loanResult, propertyResult, qmResult] = await Promise.all([
    adminClient()
      .from("loan_applications")
      .select("id, organization_id, status, loan_purpose")
      .eq("id", loanId)
      .single(),
    adminClient()
      .from("properties")
      .select("property_type, address")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .maybeSingle(),
    computeQMForLoan(loanId),
  ]);

  if (loanResult.error || !loanResult.data) {
    throw new Error(loanResult.error?.message ?? "Loan not found.");
  }

  const payload = buildHMDAInput({
    organizationId: loanResult.data.organization_id,
    loanId,
    status: loanResult.data.status,
    loanPurpose: loanResult.data.loan_purpose,
    propertyType: propertyResult.data?.property_type ?? null,
    propertyAddress:
      propertyResult.data?.address && typeof propertyResult.data.address === "object"
        ? (propertyResult.data.address as { zip?: string; state?: string; county?: string })
        : null,
    denialReasons,
    rateSpread: qmResult.rateSpread,
    isHOEPA: qmResult.isHOEPA,
  });

  if (payload.action_taken === null) {
    return null;
  }

  const { data, error } = await adminClient()
    .from("hmda_records")
    .upsert(payload, { onConflict: "loan_application_id" })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to save HMDA record.");
  }

  return data.id;
}

export async function issueDisclosure(
  loanId: string,
  disclosureType: "LE" | "CD",
): Promise<ActionResult<void>> {
  try {
    const { profile } = await requireStaffContext();
    const [loanResult, existingResult, documentResult] = await Promise.all([
      adminClient()
        .from("loan_applications")
        .select("id, organization_id, borrower_id, loan_number, submitted_at, estimated_closing")
        .eq("id", loanId)
        .single(),
      adminClient()
        .from("disclosures")
        .select("id, version")
        .eq("loan_application_id", loanId)
        .eq("disclosure_type", disclosureType)
        .is("deleted_at", null)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminClient()
        .from("documents")
        .select("id")
        .eq("loan_application_id", loanId)
        .eq("document_type", disclosureType === "LE" ? "loan_estimate" : "closing_disclosure")
        .eq("is_latest", true)
        .is("deleted_at", null)
        .maybeSingle(),
    ]);

    if (loanResult.error || !loanResult.data || loanResult.data.organization_id !== profile.organization_id) {
      throw new Error(loanResult.error?.message ?? "Loan not found.");
    }

    const deadline = calculateDisclosureDeadline({
      disclosureType,
      submittedAt: loanResult.data.submitted_at,
      closingDate: loanResult.data.estimated_closing,
    });

    if (!deadline) {
      throw new Error(
        disclosureType === "LE"
          ? "Loan Estimate requires a submitted application date."
          : "Closing Disclosure requires an estimated closing date.",
      );
    }

    if (existingResult.data?.id) {
      await adminClient()
        .from("disclosures")
        .update({ status: "superseded" })
        .eq("id", existingResult.data.id);
    }

    const { error } = await adminClient().from("disclosures").insert({
      loan_application_id: loanId,
      issued_by: profile.id,
      disclosure_type: disclosureType,
      version: Number(existingResult.data?.version ?? 0) + 1,
      sent_at: new Date().toISOString(),
      deadline: deadline.toISOString(),
      status: "sent",
      document_id: documentResult.data?.id ?? null,
      notes: `${disclosureType} issued from compliance workspace.`,
    });

    if (error) {
      throw new Error(error.message);
    }

    const borrowerName = await getProfileName(loanResult.data.borrower_id);
    await createNotification({
      organizationId: loanResult.data.organization_id,
      recipientId: loanResult.data.borrower_id,
      type: "disclosure_due",
      title: `${disclosureType} issued`,
      body: `${disclosureType} has been issued for loan ${loanResult.data.loan_number ?? loanId}.`,
      actionUrl: `${getAppUrl()}/borrower/loans/${loanId}`,
      resourceType: "loan",
      resourceId: loanId,
      emailTriggerEvent: "status_changed",
      emailVariables: {
        borrower_name: borrowerName,
        loan_number: loanResult.data.loan_number ?? loanId,
        loan_status: `${disclosureType} issued`,
        portal_url: `${getAppUrl()}/borrower/loans/${loanId}`,
      },
    });

    revalidatePath(`/staff/loans/${loanId}/compliance`);
    revalidatePath(`/admin/compliance`);
    revalidatePath(`/borrower/loans/${loanId}`);

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}
