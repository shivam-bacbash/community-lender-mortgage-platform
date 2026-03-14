"use server";

import { revalidatePath } from "next/cache";

import { analyzeUnderwriting } from "@/lib/ai/analyses";
import {
  parseRiskAssessmentResult,
  parseUnderwritingSummaryResult,
} from "@/lib/ai/results";
import { getDocumentTypeLabel } from "@/lib/documents/config";
import { getResendClient } from "@/lib/email/resend";
import {
  completeTaskSchema,
  conditionSchema,
  documentRequestSchema,
  documentReviewSchema,
  moveLoanStageSchema,
  resolveConditionSchema,
  staffMessageSchema,
  taskSchema,
  underwritingDecisionSchema,
  type ConditionInput,
  type DocumentRequestInput,
  type DocumentReviewInput,
  type StaffMessageInput,
  type TaskInput,
  type UnderwritingDecisionInput,
} from "@/lib/validations/loans";
import {
  getAppUrl,
  getResendFromEmail,
} from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isStaffRole } from "@/lib/auth/roles";
import type { ActionResult } from "@/types/auth";

type StaffContext = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  profile: {
    id: string;
    organization_id: string;
    role: string;
    first_name: string;
    last_name: string;
  };
};

function getAdminClient() {
  return createSupabaseAdminClient();
}

async function requireStaffContext(): Promise<StaffContext> {
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

  if (profileError || !profile || !isStaffRole(profile.role)) {
    throw new Error("Staff access is required.");
  }

  return { supabase, profile };
}

async function getLoanForStaff(loanId: string, context: StaffContext) {
  const { data, error } = await context.supabase
    .from("loan_applications")
    .select("id, organization_id, borrower_id, loan_number, status, pipeline_stage_id, loan_amount")
    .eq("id", loanId)
    .single();

  if (error || !data) {
    throw new Error("Loan application not found.");
  }

  if (data.organization_id !== context.profile.organization_id) {
    throw new Error("You do not have access to this loan.");
  }

  return data;
}

async function writeAuditLog(params: {
  context: StaffContext;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeState?: object;
  afterState?: object;
}) {
  const { context, action, resourceType, resourceId, beforeState, afterState } = params;

  await context.supabase.from("audit_logs").insert({
    organization_id: context.profile.organization_id,
    actor_id: context.profile.id,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    before_state: beforeState ?? {},
    after_state: afterState ?? {},
  });
}

async function notifyBorrower(params: {
  context: StaffContext;
  borrowerId: string;
  type: string;
  title: string;
  body: string;
  resourceType: "loan" | "task" | "document" | "message" | "condition";
  resourceId: string;
  actionUrl: string;
}) {
  const { context, borrowerId, ...notification } = params;
  const admin = getAdminClient();

  await admin.from("notifications").insert({
    organization_id: context.profile.organization_id,
    recipient_id: borrowerId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    resource_type: notification.resourceType,
    resource_id: notification.resourceId,
    action_url: notification.actionUrl,
    sent_via: ["in_app"],
  });
}

function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function revalidateLoanPaths(loanId: string) {
  revalidatePath("/staff/dashboard");
  revalidatePath("/staff/pipeline");
  revalidatePath(`/staff/loans/${loanId}`);
  revalidatePath(`/staff/loans/${loanId}/borrower`);
  revalidatePath(`/staff/loans/${loanId}/documents`);
  revalidatePath(`/staff/loans/${loanId}/underwriting`);
  revalidatePath(`/staff/loans/${loanId}/conditions`);
  revalidatePath(`/staff/loans/${loanId}/tasks`);
  revalidatePath(`/staff/loans/${loanId}/messages`);
  revalidatePath(`/borrower/loans/${loanId}`);
  revalidatePath(`/borrower/loans/${loanId}/documents`);
}

export async function rerunUnderwritingAnalysis(
  loanId: string,
): Promise<ActionResult<void>> {
  try {
    const context = await requireStaffContext();
    await getLoanForStaff(loanId, context);

    if (!["loan_officer", "underwriter", "admin"].includes(context.profile.role)) {
      return { data: null, error: "This role cannot run AI underwriting analysis." };
    }

    await analyzeUnderwriting(loanId, context.profile.id);

    await writeAuditLog({
      context,
      action: "loan.ai_underwriting_rerun",
      resourceType: "loan_application",
      resourceId: loanId,
      afterState: { triggered_by: context.profile.id },
    });

    revalidateLoanPaths(loanId);

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function moveLoanStage(
  loanId: string,
  newStageId: string,
): Promise<ActionResult<void>> {
  try {
    const payload = moveLoanStageSchema.parse({ loanId, newStageId });
    const context = await requireStaffContext();
    const loan = await getLoanForStaff(payload.loanId, context);

    if (!["loan_officer", "processor", "underwriter"].includes(context.profile.role)) {
      return { data: null, error: "This role cannot move pipeline stages." };
    }

    const { error } = await context.supabase
      .from("loan_applications")
      .update({ pipeline_stage_id: payload.newStageId })
      .eq("id", payload.loanId);

    if (error) {
      throw new Error(error.message);
    }

    await writeAuditLog({
      context,
      action: "loan.stage_changed",
      resourceType: "loan_application",
      resourceId: payload.loanId,
      beforeState: { pipeline_stage_id: loan.pipeline_stage_id },
      afterState: { pipeline_stage_id: payload.newStageId },
    });

    revalidateLoanPaths(payload.loanId);

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function submitUWDecision(
  loanId: string,
  values: UnderwritingDecisionInput,
): Promise<ActionResult<void>> {
  try {
    const payload = underwritingDecisionSchema.parse(values);
    const context = await requireStaffContext();
    const loan = await getLoanForStaff(loanId, context);

    if (!["underwriter", "admin"].includes(context.profile.role)) {
      return { data: null, error: "Only underwriters can submit decisions." };
    }

    const [latestRiskAssessment, latestAiSummary, decisionPassResult] = await Promise.all([
      context.supabase
        .from("ai_analyses")
        .select("result")
        .eq("loan_application_id", loanId)
        .eq("analysis_type", "risk_assessment")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      context.supabase
        .from("ai_analyses")
        .select("result")
        .eq("loan_application_id", loanId)
        .eq("analysis_type", "underwriting_summary")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      context.supabase
        .from("underwriting_decisions")
        .select("decision_pass")
        .eq("loan_application_id", loanId)
        .is("deleted_at", null)
        .order("decision_pass", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const riskAssessment = latestRiskAssessment.data
      ? parseRiskAssessmentResult(latestRiskAssessment.data.result)
      : null;

    if (
      riskAssessment &&
      !riskAssessment.eligible_for_approval &&
      ["approved", "approved_with_conditions"].includes(payload.decision)
    ) {
      return {
        data: null,
        error: "Automated underwriting found hard-stop failures. Resolve them or use a non-approval decision.",
      };
    }

    const aiSummary = latestAiSummary.data
      ? parseUnderwritingSummaryResult(latestAiSummary.data.result)
      : null;

    const loanWorkspace = await context.supabase
      .from("credit_reports")
      .select("score")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("pulled_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const borrowerProfileResult = await context.supabase
      .from("borrower_profiles")
      .select("id, monthly_housing_payment")
      .eq("loan_application_id", loanId)
      .maybeSingle();

    const borrowerProfileId = borrowerProfileResult.data?.id;
    const [employmentResult, liabilitiesResult, propertyResult] = borrowerProfileId
      ? await Promise.all([
          context.supabase
            .from("employment_records")
            .select("base_monthly_income, overtime_monthly, bonus_monthly, commission_monthly, other_monthly")
            .eq("borrower_profile_id", borrowerProfileId)
            .is("deleted_at", null),
          context.supabase
            .from("liabilities")
            .select("monthly_payment, exclude_from_dti, to_be_paid_off")
            .eq("borrower_profile_id", borrowerProfileId)
            .is("deleted_at", null),
          context.supabase
            .from("properties")
            .select("purchase_price, estimated_value, appraised_value")
            .eq("loan_application_id", loanId)
            .is("deleted_at", null)
            .maybeSingle(),
        ])
      : [
          { data: [] as Array<Record<string, number | null>> },
          { data: [] as Array<Record<string, number | boolean>> },
          { data: null as { purchase_price: number | null; estimated_value: number | null; appraised_value: number | null } | null },
        ];

    const grossIncome = (employmentResult.data ?? []).reduce((sum, record) => {
      return (
        sum +
        Number(record.base_monthly_income ?? 0) +
        Number(record.overtime_monthly ?? 0) +
        Number(record.bonus_monthly ?? 0) +
        Number(record.commission_monthly ?? 0) +
        Number(record.other_monthly ?? 0)
      );
    }, 0);

    const liabilities = (liabilitiesResult.data ?? []).reduce((sum, item) => {
      if (item.exclude_from_dti || item.to_be_paid_off) {
        return sum;
      }
      return sum + Number(item.monthly_payment ?? 0);
    }, 0);

    const monthlyHousing = Number(borrowerProfileResult.data?.monthly_housing_payment ?? 0);
    const propertyValue =
      propertyResult.data?.appraised_value ??
      propertyResult.data?.estimated_value ??
      propertyResult.data?.purchase_price ??
      null;

    const dtiRatio = grossIncome > 0 ? (liabilities + monthlyHousing) / grossIncome : null;
    const computedLtv =
      propertyValue && propertyValue > 0
        ? Number(loan.loan_amount ?? 0) / Number(propertyValue)
        : null;

    const { error: insertError } = await context.supabase.from("underwriting_decisions").insert({
      loan_application_id: loanId,
      underwriter_id: context.profile.id,
      decision: payload.decision,
      decision_pass: Number(decisionPassResult.data?.decision_pass ?? 0) + 1,
      approved_amount: payload.approved_amount ?? null,
      notes: payload.notes ?? null,
      denial_reasons: payload.denial_reasons ?? [],
      dti_ratio: dtiRatio,
      ltv_ratio: computedLtv,
      credit_score_used: loanWorkspace.data?.score ?? null,
      ai_summary: aiSummary ?? {},
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    const nextStatus =
      payload.decision === "approved"
        ? "approved"
        : payload.decision === "approved_with_conditions"
          ? "processing"
          : payload.decision === "suspended"
            ? "underwriting"
            : "denied";

    const { error: updateError } = await context.supabase
      .from("loan_applications")
      .update({
        status: nextStatus,
        approved_at: payload.decision === "approved" ? new Date().toISOString() : null,
        denied_at: payload.decision === "denied" ? new Date().toISOString() : null,
      })
      .eq("id", loanId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await writeAuditLog({
      context,
      action: "underwriting.decision_made",
      resourceType: "loan_application",
      resourceId: loanId,
      afterState: {
        decision: payload.decision,
        approved_amount: payload.approved_amount ?? null,
      },
    });

    await notifyBorrower({
      context,
      borrowerId: loan.borrower_id,
      type: "status_change",
      title: `Loan decision: ${payload.decision.replaceAll("_", " ")}`,
      body: `Your loan ${loan.loan_number ?? ""} has a new underwriting decision.`,
      resourceType: "loan",
      resourceId: loanId,
      actionUrl: `${getAppUrl()}/borrower/loans/${loanId}`,
    });

    if (payload.decision === "approved" && process.env.RESEND_API_KEY) {
      const borrowerUser = await getAdminClient().auth.admin.getUserById(loan.borrower_id);
      const email = borrowerUser.data.user?.email;

      if (email) {
        const resend = getResendClient();
        await resend.emails.send({
          from: getResendFromEmail(),
          to: email,
          subject: `Loan ${loan.loan_number ?? ""} approved`,
          html: `<p>Your loan has been approved. Review the latest status in the borrower portal.</p>`,
        });
      }
    }

    revalidateLoanPaths(loanId);

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function requestDocument(
  loanId: string,
  values: DocumentRequestInput,
): Promise<ActionResult<void>> {
  try {
    const payload = documentRequestSchema.parse({ ...values, loanId });
    const context = await requireStaffContext();
    const loan = await getLoanForStaff(payload.loanId, context);

    if (!["loan_officer", "processor", "underwriter"].includes(context.profile.role)) {
      return { data: null, error: "This role cannot request borrower documents." };
    }

    const { error } = await context.supabase.from("document_requests").insert({
      loan_application_id: payload.loanId,
      requested_by: context.profile.id,
      document_type: payload.documentType,
      message: payload.message ?? null,
      due_date: payload.dueDate || null,
    });

    if (error) {
      throw new Error(error.message);
    }

    await writeAuditLog({
      context,
      action: "document.requested",
      resourceType: "loan_application",
      resourceId: payload.loanId,
      afterState: {
        document_type: payload.documentType,
        due_date: payload.dueDate ?? null,
      },
    });

    await notifyBorrower({
      context,
      borrowerId: loan.borrower_id,
      type: "doc_requested",
      title: "Document requested",
      body: payload.message ?? `Please upload a ${payload.documentType.replaceAll("_", " ")}.`,
      resourceType: "loan",
      resourceId: payload.loanId,
      actionUrl: `${getAppUrl()}/borrower/loans/${payload.loanId}/documents`,
    });

    revalidateLoanPaths(payload.loanId);

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function reviewDocument(
  values: DocumentReviewInput,
): Promise<ActionResult<void>> {
  try {
    const payload = documentReviewSchema.parse(values);
    const context = await requireStaffContext();
    const { data: document, error: documentError } = await context.supabase
      .from("documents")
      .select("id, loan_application_id, status, organization_id, document_type")
      .eq("id", payload.documentId)
      .single();

    if (documentError || !document) {
      throw new Error(documentError?.message ?? "Document not found.");
    }

    if (document.organization_id !== context.profile.organization_id) {
      throw new Error("You do not have access to this document.");
    }

    const nextStatus = payload.action === "accept" ? "accepted" : "rejected";
    const { error } = await context.supabase
      .from("documents")
      .update({
        status: nextStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.profile.id,
        rejection_reason:
          payload.action === "reject" ? payload.rejectionReason ?? "Needs a new version." : null,
      })
      .eq("id", payload.documentId);

    if (error) {
      throw new Error(error.message);
    }

    if (payload.action === "reject") {
      const { data: fulfilledRequest } = await context.supabase
        .from("document_requests")
        .select("id")
        .eq("loan_application_id", document.loan_application_id)
        .eq("fulfilled_by_document_id", payload.documentId)
        .is("deleted_at", null)
        .maybeSingle();

      if (fulfilledRequest?.id) {
        const { error: requestError } = await context.supabase
          .from("document_requests")
          .update({
            status: "pending",
            fulfilled_by_document_id: null,
            fulfilled_at: null,
          })
          .eq("id", fulfilledRequest.id);

        if (requestError) {
          throw new Error(requestError.message);
        }
      }
    }

    await writeAuditLog({
      context,
      action: payload.action === "accept" ? "document.accepted" : "document.rejected",
      resourceType: "document",
      resourceId: payload.documentId,
      beforeState: { status: document.status },
      afterState: {
        status: nextStatus,
        rejection_reason: payload.rejectionReason ?? null,
      },
    });

    const loan = await getLoanForStaff(document.loan_application_id, context);
    const notificationTitle =
      payload.action === "accept" ? "Document accepted" : "Document needs a new version";
    const notificationBody =
      payload.action === "accept"
        ? `${getDocumentTypeLabel(document.document_type)} was accepted by your loan team.`
        : payload.rejectionReason ??
          `${getDocumentTypeLabel(document.document_type)} was rejected and needs to be re-uploaded.`;

    await notifyBorrower({
      context,
      borrowerId: loan.borrower_id,
      type: payload.action === "accept" ? "doc_accepted" : "doc_rejected",
      title: notificationTitle,
      body: notificationBody,
      resourceType: "document",
      resourceId: payload.documentId,
      actionUrl: `${getAppUrl()}/borrower/loans/${document.loan_application_id}/documents`,
    });

    revalidateLoanPaths(document.loan_application_id);

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function addCondition(
  values: ConditionInput,
): Promise<ActionResult<void>> {
  try {
    const payload = conditionSchema.parse(values);
    const context = await requireStaffContext();
    const loan = await getLoanForStaff(payload.loanId, context);

    if (!["loan_officer", "processor", "underwriter"].includes(context.profile.role)) {
      return { data: null, error: "This role cannot add loan conditions." };
    }

    const { error } = await context.supabase.from("conditions").insert({
      loan_application_id: payload.loanId,
      condition_type: payload.condition_type,
      source: payload.source ?? null,
      description: payload.description,
      assigned_to: payload.assigned_to ?? null,
      due_date: payload.due_date || null,
    });

    if (error) {
      throw new Error(error.message);
    }

    await writeAuditLog({
      context,
      action: "condition.created",
      resourceType: "loan_application",
      resourceId: payload.loanId,
      afterState: {
        condition_type: payload.condition_type,
        description: payload.description,
      },
    });

    await notifyBorrower({
      context,
      borrowerId: loan.borrower_id,
      type: "condition_added",
      title: "New loan condition added",
      body: payload.description,
      resourceType: "condition",
      resourceId: payload.loanId,
      actionUrl: `${getAppUrl()}/borrower/loans/${payload.loanId}`,
    });

    revalidateLoanPaths(payload.loanId);

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function resolveCondition(
  conditionId: string,
  action: "satisfy" | "waive",
  reason?: string,
): Promise<ActionResult<void>> {
  try {
    const payload = resolveConditionSchema.parse({ conditionId, action, reason });
    const context = await requireStaffContext();
    const { data: condition, error: conditionError } = await context.supabase
      .from("conditions")
      .select("id, loan_application_id, status")
      .eq("id", payload.conditionId)
      .single();

    if (conditionError || !condition) {
      throw new Error(conditionError?.message ?? "Condition not found.");
    }

    const loan = await getLoanForStaff(condition.loan_application_id, context);
    const { error } = await context.supabase
      .from("conditions")
      .update({
        status: payload.action === "satisfy" ? "satisfied" : "waived",
        resolved_at: new Date().toISOString(),
        resolved_by: context.profile.id,
        waived_reason: payload.action === "waive" ? payload.reason ?? null : null,
      })
      .eq("id", payload.conditionId);

    if (error) {
      throw new Error(error.message);
    }

    await writeAuditLog({
      context,
      action: payload.action === "satisfy" ? "condition.satisfied" : "condition.waived",
      resourceType: "condition",
      resourceId: payload.conditionId,
      beforeState: { status: condition.status },
      afterState: {
        status: payload.action === "satisfy" ? "satisfied" : "waived",
      },
    });

    await notifyBorrower({
      context,
      borrowerId: loan.borrower_id,
      type: "condition_added",
      title: `Condition ${payload.action === "satisfy" ? "satisfied" : "waived"}`,
      body: payload.reason ?? "A loan condition was updated.",
      resourceType: "condition",
      resourceId: payload.conditionId,
      actionUrl: `${getAppUrl()}/borrower/loans/${condition.loan_application_id}`,
    });

    revalidateLoanPaths(condition.loan_application_id);

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function createTask(values: TaskInput): Promise<ActionResult<void>> {
  try {
    const payload = taskSchema.parse(values);
    const context = await requireStaffContext();
    const loan = await getLoanForStaff(payload.loanId, context);

    const { data: task, error } = await context.supabase
      .from("tasks")
      .insert({
        loan_application_id: payload.loanId,
        assigned_to: payload.assigned_to ?? null,
        assigned_by: context.profile.id,
        title: payload.title,
        description: payload.description ?? null,
        due_date: payload.due_date || null,
        priority: payload.priority,
        task_type: payload.task_type ?? null,
      })
      .select("id")
      .single();

    if (error || !task) {
      throw new Error(error?.message ?? "Unable to create the task.");
    }

    await writeAuditLog({
      context,
      action: "task.created",
      resourceType: "task",
      resourceId: task.id,
      afterState: {
        title: payload.title,
        assigned_to: payload.assigned_to ?? null,
      },
    });

    if (payload.assigned_to) {
      await getAdminClient().from("notifications").insert({
        organization_id: context.profile.organization_id,
        recipient_id: payload.assigned_to,
        type: "task_assigned",
        title: "Task assigned",
        body: payload.title,
        resource_type: "task",
        resource_id: task.id,
        action_url: `${getAppUrl()}/staff/loans/${payload.loanId}/tasks`,
        sent_via: ["in_app"],
      });
    }

    await notifyBorrower({
      context,
      borrowerId: loan.borrower_id,
      type: "task_assigned",
      title: "New borrower action item",
      body: payload.title,
      resourceType: "task",
      resourceId: task.id,
      actionUrl: `${getAppUrl()}/borrower/loans/${payload.loanId}`,
    });

    revalidateLoanPaths(payload.loanId);

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function completeTask(taskId: string): Promise<ActionResult<void>> {
  try {
    const payload = completeTaskSchema.parse({ taskId });
    const context = await requireStaffContext();
    const { data: task, error: taskError } = await context.supabase
      .from("tasks")
      .select("id, loan_application_id, status")
      .eq("id", payload.taskId)
      .single();

    if (taskError || !task) {
      throw new Error(taskError?.message ?? "Task not found.");
    }

    await getLoanForStaff(task.loan_application_id, context);

    const { error } = await context.supabase
      .from("tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_by: context.profile.id,
      })
      .eq("id", payload.taskId);

    if (error) {
      throw new Error(error.message);
    }

    await writeAuditLog({
      context,
      action: "task.completed",
      resourceType: "task",
      resourceId: payload.taskId,
      beforeState: { status: task.status },
      afterState: { status: "completed" },
    });

    revalidateLoanPaths(task.loan_application_id);

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}

export async function sendStaffMessage(
  values: StaffMessageInput,
): Promise<ActionResult<void>> {
  try {
    const payload = staffMessageSchema.parse(values);
    const context = await requireStaffContext();
    const loan = await getLoanForStaff(payload.loanId, context);

    const { data: message, error } = await context.supabase
      .from("messages")
      .insert({
        loan_application_id: payload.loanId,
        sender_id: context.profile.id,
        body: payload.body,
        is_internal: payload.isInternal,
        channel: "in_app",
      })
      .select("id")
      .single();

    if (error || !message) {
      throw new Error(error?.message ?? "Unable to send the message.");
    }

    await writeAuditLog({
      context,
      action: payload.isInternal ? "message.internal_sent" : "message.sent",
      resourceType: "message",
      resourceId: message.id,
      afterState: { is_internal: payload.isInternal },
    });

    if (!payload.isInternal) {
      await notifyBorrower({
        context,
        borrowerId: loan.borrower_id,
        type: "message_received",
        title: "New message from your loan team",
        body: payload.body,
        resourceType: "message",
        resourceId: message.id,
        actionUrl: `${getAppUrl()}/borrower/loans/${payload.loanId}/messages`,
      });
    }

    revalidateLoanPaths(payload.loanId);

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: normalizeError(error) };
  }
}
