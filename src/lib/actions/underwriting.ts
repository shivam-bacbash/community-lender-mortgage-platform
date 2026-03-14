"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isStaffRole } from "@/lib/auth/roles";
import { pullCreditReport } from "@/lib/integrations/credit";
import {
  ensureDefaultUnderwritingRules,
  evaluateLoan,
  storeUnderwritingEvaluation,
} from "@/lib/underwriting/engine";
import {
  pullCreditReportSchema,
  runAutomatedUnderwritingSchema,
  underwritingRuleSchema,
  type UnderwritingRuleInput,
} from "@/lib/validations/underwriting";
import type { ActionResult } from "@/types/auth";

function adminClient() {
  return createSupabaseAdminClient();
}

function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function revalidateUnderwritingPaths(loanId?: string) {
  revalidatePath("/admin/settings/underwriting");
  if (loanId) {
    revalidatePath(`/staff/loans/${loanId}`);
    revalidatePath(`/staff/loans/${loanId}/underwriting`);
    revalidatePath("/staff/pipeline");
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

async function getLoanForOrganization(loanId: string, organizationId: string) {
  const { data, error } = await adminClient()
    .from("loan_applications")
    .select("id, organization_id, borrower_id, loan_type")
    .eq("id", loanId)
    .single();

  if (error || !data || data.organization_id !== organizationId) {
    throw new Error("Loan application not found.");
  }

  return data;
}

export async function saveUnderwritingRule(
  values: UnderwritingRuleInput,
): Promise<ActionResult<void>> {
  try {
    const payload = underwritingRuleSchema.parse(values);
    const { profile } = await requireAdminContext();
    await ensureDefaultUnderwritingRules(profile.organization_id);

    const { error } = await adminClient()
      .from("underwriting_rules")
      .upsert(
        {
          id: payload.id,
          organization_id: profile.organization_id,
          loan_type: payload.loan_type,
          rule_name: payload.rule_name,
          rule_config: {
            ...(typeof payload.min === "number" ? { min: payload.min } : {}),
            ...(typeof payload.max === "number" ? { max: payload.max } : {}),
          },
          is_active: payload.is_active,
          priority: payload.priority,
          description: payload.description ?? null,
        },
        {
          onConflict: "organization_id,loan_type,rule_name",
        },
      );

    if (error) {
      throw new Error(error.message);
    }

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "underwriting.rule_saved",
      resourceType: "underwriting_rule",
      resourceId: payload.id ?? `${payload.loan_type}:${payload.rule_name}`,
      afterState: payload,
    });

    revalidateUnderwritingPaths();
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function runAutomatedUnderwriting(
  loanId: string,
): Promise<ActionResult<void>> {
  try {
    const payload = runAutomatedUnderwritingSchema.parse({ loanId });
    const { profile } = await requireStaffContext();
    const loan = await getLoanForOrganization(payload.loanId, profile.organization_id);

    const evaluation = await evaluateLoan(payload.loanId, profile.organization_id);

    await storeUnderwritingEvaluation({
      loanId: payload.loanId,
      triggeredByProfile: profile.id,
      snapshot: {
        values: evaluation.values,
        loan_type: evaluation.loan_type,
      },
      evaluation,
    });

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "underwriting.automated_run",
      resourceType: "loan_application",
      resourceId: loan.id,
      afterState: {
        recommendation: evaluation.recommendation,
        hard_stop_failures: evaluation.hard_stop_failures,
      },
    });

    revalidateUnderwritingPaths(payload.loanId);
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function pullMockCreditReport(
  loanId: string,
): Promise<ActionResult<void>> {
  try {
    const payload = pullCreditReportSchema.parse({ loanId });
    const { profile } = await requireStaffContext();
    const loan = await getLoanForOrganization(payload.loanId, profile.organization_id);

    const { data: borrowerProfile, error: borrowerProfileError } = await adminClient()
      .from("borrower_profiles")
      .select("id")
      .eq("loan_application_id", payload.loanId)
      .eq("profile_id", loan.borrower_id)
      .maybeSingle();

    if (borrowerProfileError || !borrowerProfile?.id) {
      throw new Error(borrowerProfileError?.message ?? "Borrower profile not found for credit pull.");
    }

    const report = await pullCreditReport(borrowerProfile.id, payload.loanId, profile.id);

    await writeAuditLog({
      organizationId: profile.organization_id,
      actorId: profile.id,
      action: "credit_report.pulled_mock",
      resourceType: "loan_application",
      resourceId: payload.loanId,
      afterState: {
        bureau: report.bureau,
        score: report.score,
      },
    });

    revalidateUnderwritingPaths(payload.loanId);
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}
