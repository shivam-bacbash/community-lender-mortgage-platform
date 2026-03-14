import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import {
  parseDocumentExtractionResult,
  parseRiskAssessmentResult,
  parseUnderwritingSummaryResult,
} from "@/lib/ai/results";
import {
  getDocumentTypeLabel,
  getRequiredDocumentsForLoanType,
} from "@/lib/documents/config";
import { isStaffRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  StaffActivityItem,
  StaffDocumentChecklistItem,
  StaffDocumentExpiryItem,
  StaffLoanHeader,
  StaffLoanDocumentDetail,
  StaffLoanWorkspace,
  StaffMetricCard,
  StaffPipelineData,
  StaffProfileSummary,
  StaffTaskPreview,
} from "@/types/staff";
import type { Json } from "@/types/database";

async function requireStaffContext(): Promise<{
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  user: User;
  profile: StaffProfileSummary;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, role, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !isStaffRole(profile.role)) {
    redirect("/login");
  }

  return {
    supabase,
    user,
    profile: profile as StaffProfileSummary,
  };
}

async function getNameMap(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ids: string[],
  organizationId: string,
): Promise<Map<string, { name: string; role: string }>> {
  if (!ids.length) {
    return new Map();
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .eq("organization_id", organizationId)
    .in("id", ids);

  return new Map(
    (data ?? []).map((profile) => [
      profile.id,
      {
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        role: profile.role,
      },
    ]),
  );
}

function extractRiskScore(result: Json): number | null {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return null;
  }

  const value =
    ("score" in result && typeof result.score === "number" && result.score) ||
    ("risk_score" in result && typeof result.risk_score === "number" && result.risk_score) ||
    null;

  return value;
}

function extractRecommendation(result: Json): string | null {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return null;
  }

  if ("recommendation" in result && typeof result.recommendation === "string") {
    return result.recommendation;
  }

  return null;
}

function getDocumentChecklist(
  loanType: string,
  documents: Array<{ document_type: string; status: string }>,
): StaffDocumentChecklistItem[] {
  const latestByType = new Map(documents.map((document) => [document.document_type, document.status]));

  return getRequiredDocumentsForLoanType(loanType).map((documentType) => {
    const status = latestByType.get(documentType) ?? null;

    return {
      document_type: documentType,
      label: getDocumentTypeLabel(documentType),
      is_complete: status === "accepted" || status === "pending" || status === "under_review",
      latest_status: status,
    };
  });
}

function getExpiringDocuments(
  documents: Array<{ id: string; document_type: string; file_name: string; expires_at: string | null }>,
): StaffDocumentExpiryItem[] {
  const now = Date.now();
  const warningCutoff = now + 7 * 24 * 60 * 60 * 1000;

  return documents.flatMap((document) => {
    if (!document.expires_at) {
      return [];
    }

    const expiresAt = new Date(document.expires_at).getTime();
    if (Number.isNaN(expiresAt) || expiresAt > warningCutoff) {
      return [];
    }

    return [
      {
        id: document.id,
        document_type: document.document_type,
        file_name: document.file_name,
        expires_at: document.expires_at,
        status: expiresAt < now ? "expired" : "expiring_soon",
      },
    ];
  });
}

async function getStaffMembers(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string,
) {
  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .eq("organization_id", organizationId)
    .in("role", ["loan_officer", "processor", "underwriter", "admin"])
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("first_name", { ascending: true });

  return (data ?? []).map((member) => ({
    id: member.id,
    label: `${member.first_name} ${member.last_name}`.trim(),
    role: member.role,
  }));
}

export const getStaffShellData = cache(async () => {
  const { profile } = await requireStaffContext();

  return profile;
});

export async function getStaffDashboardData(): Promise<{
  profile: StaffProfileSummary;
  metrics: StaffMetricCard[];
  recentActivity: StaffActivityItem[];
  myTasks: StaffTaskPreview[];
}> {
  const { supabase, profile } = await requireStaffContext();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 7);

  const [activeLoans, submittedToday, awaitingUw, closingThisWeek, tasksResult] =
    await Promise.all([
      supabase
        .from("loan_applications")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
        .is("deleted_at", null)
        .not("status", "in", '("funded","denied","withdrawn")'),
      supabase
        .from("loan_applications")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
        .eq("status", "submitted")
        .gte("submitted_at", startOfDay),
      supabase
        .from("loan_applications")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
        .eq("status", "underwriting")
        .is("deleted_at", null),
      supabase
        .from("loan_applications")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
        .gte("estimated_closing", startOfDay.slice(0, 10))
        .lte("estimated_closing", endOfWeek.toISOString().slice(0, 10))
        .is("deleted_at", null),
      supabase
        .from("tasks")
        .select("id, loan_application_id, title, status, due_date, priority")
        .eq("assigned_to", profile.id)
        .is("deleted_at", null)
        .not("status", "in", '("completed","cancelled")')
        .order("due_date", { ascending: true })
        .limit(8),
    ]);

  const taskLoanIds = [...new Set((tasksResult.data ?? []).map((task) => task.loan_application_id))];
  const { data: taskLoans } = taskLoanIds.length
    ? await supabase
        .from("loan_applications")
        .select("id, loan_number")
        .in("id", taskLoanIds)
    : { data: [] as Array<{ id: string; loan_number: string | null }> };

  const taskLoanMap = new Map((taskLoans ?? []).map((loan) => [loan.id, loan.loan_number]));

  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("id, action, resource_type, resource_id, actor_id, created_at")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(20);

  const actorMap = await getNameMap(
    supabase,
    [...new Set((auditLogs ?? []).map((log) => log.actor_id).filter(Boolean) as string[])],
    profile.organization_id,
  );

  return {
    profile,
    metrics: [
      {
        label: "Active loans",
        value: activeLoans.count ?? 0,
        helper: "Open loans in the working pipeline",
      },
      {
        label: "Submitted today",
        value: submittedToday.count ?? 0,
        helper: "Fresh submissions since midnight",
      },
      {
        label: "Awaiting UW",
        value: awaitingUw.count ?? 0,
        helper: "Files currently in underwriting",
      },
      {
        label: "Closing this week",
        value: closingThisWeek.count ?? 0,
        helper: "Estimated closings in the next 7 days",
      },
    ],
    recentActivity: (auditLogs ?? []).map((log) => ({
      id: log.id,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      created_at: log.created_at,
      actor_name: log.actor_id ? actorMap.get(log.actor_id)?.name ?? "System" : "System",
    })),
    myTasks: (tasksResult.data ?? []).map((task) => ({
      id: task.id,
      loan_application_id: task.loan_application_id,
      title: task.title,
      status: task.status,
      due_date: task.due_date,
      priority: task.priority,
      loan_number: taskLoanMap.get(task.loan_application_id) ?? null,
    })),
  };
}

export async function readStaffPipelineData(): Promise<StaffPipelineData> {
  const { supabase, profile } = await requireStaffContext();
  const [stagesResult, loansResult, staffMembers, aiResult] = await Promise.all([
    supabase
      .from("pipeline_stages")
      .select("id, name, color, order_index, sla_days, is_terminal")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .order("order_index", { ascending: true }),
    supabase
      .from("loan_applications")
      .select(
        "id, organization_id, borrower_id, loan_officer_id, loan_number, status, loan_amount, loan_purpose, loan_type, submitted_at, estimated_closing, updated_at, pipeline_stage_id",
      )
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .not("status", "in", '("funded","denied","withdrawn","cancelled")')
      .order("updated_at", { ascending: false }),
    getStaffMembers(supabase, profile.organization_id),
    supabase
      .from("ai_analyses")
      .select("id, loan_application_id, result, created_at")
      .eq("analysis_type", "underwriting_summary")
      .eq("status", "completed")
      .order("created_at", { ascending: false }),
  ]);

  if (stagesResult.error) {
    throw new Error(stagesResult.error.message);
  }

  if (loansResult.error) {
    throw new Error(loansResult.error.message);
  }

  if (aiResult.error) {
    throw new Error(aiResult.error.message);
  }

  const loans = loansResult.data ?? [];
  const borrowerIds = [...new Set(loans.map((loan) => loan.borrower_id))];
  const loanOfficerIds = [...new Set(loans.map((loan) => loan.loan_officer_id).filter(Boolean) as string[])];
  const profileMap = await getNameMap(
    supabase,
    [...new Set([...borrowerIds, ...loanOfficerIds])],
    profile.organization_id,
  );

  const aiMap = new Map<string, { riskScore: number | null; recommendation: string | null }>();
  for (const analysis of aiResult.data ?? []) {
    if (!aiMap.has(analysis.loan_application_id)) {
      aiMap.set(analysis.loan_application_id, {
        riskScore: extractRiskScore(analysis.result),
        recommendation: extractRecommendation(analysis.result),
      });
    }
  }

  return {
    organizationId: profile.organization_id,
    profileId: profile.id,
    stages: stagesResult.data ?? [],
    loans: loans.map((loan) => ({
      id: loan.id,
      organization_id: loan.organization_id,
      loan_number: loan.loan_number,
      status: loan.status,
      loan_amount: loan.loan_amount,
      loan_purpose: loan.loan_purpose,
      loan_type: loan.loan_type,
      submitted_at: loan.submitted_at,
      estimated_closing: loan.estimated_closing,
      updated_at: loan.updated_at,
      pipeline_stage_id: loan.pipeline_stage_id,
      borrower_name: profileMap.get(loan.borrower_id)?.name ?? "Unknown borrower",
      loan_officer_name: loan.loan_officer_id
        ? profileMap.get(loan.loan_officer_id)?.name ?? null
        : null,
      ai_risk_score: aiMap.get(loan.id)?.riskScore ?? null,
      ai_recommendation: aiMap.get(loan.id)?.recommendation ?? null,
      days_in_stage: Math.max(
        0,
        Math.floor((Date.now() - new Date(loan.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
      ),
    })),
    staffOptions: staffMembers.map((member) => ({ id: member.id, label: member.label })),
  };
}

export async function getStaffPipelineData() {
  const data = await readStaffPipelineData();

  return {
    ...data,
    profile: await getStaffShellData(),
  };
}

export async function getStaffLoanHeader(loanId: string): Promise<StaffLoanHeader> {
  const workspace = await getStaffLoanWorkspace(loanId);
  return workspace.header;
}

export async function getStaffLoanWorkspace(loanId: string): Promise<StaffLoanWorkspace> {
  const { supabase, profile } = await requireStaffContext();
  const { data: loan, error: loanError } = await supabase
    .from("loan_applications")
    .select(
      "id, organization_id, borrower_id, loan_number, status, loan_amount, loan_type, loan_purpose, pipeline_stage_id",
    )
    .eq("id", loanId)
    .eq("organization_id", profile.organization_id)
    .single();

  if (loanError || !loan) {
    notFound();
  }

  const staffMembers = await getStaffMembers(supabase, profile.organization_id);

  const [
    borrowerData,
    stageData,
    allStagesData,
    propertyData,
    employmentData,
    assetData,
    liabilityData,
    borrowerProfileData,
    documentsData,
    documentRequestsData,
    conditionsData,
    tasksData,
    messagesData,
    underwritingData,
    aiData,
    creditData,
    auditData,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .eq("id", loan.borrower_id)
      .single(),
    loan.pipeline_stage_id
      ? supabase
          .from("pipeline_stages")
          .select("id, name, color, order_index, sla_days, is_terminal")
          .eq("id", loan.pipeline_stage_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("pipeline_stages")
      .select("id, name, color, order_index, sla_days, is_terminal")
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .order("order_index", { ascending: true }),
    supabase
      .from("properties")
      .select(
        "id, address, property_type, occupancy_type, purchase_price, estimated_value, appraised_value",
      )
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("borrower_profiles")
      .select("id")
      .eq("loan_application_id", loanId)
      .eq("profile_id", loan.borrower_id)
      .maybeSingle()
      .then(async (result) => {
        const borrowerProfileId = result.data?.id;

        if (!borrowerProfileId) {
          return { data: [] as StaffLoanWorkspace["employmentRecords"], error: null };
        }

        return supabase
          .from("employment_records")
          .select(
            "id, employer_name, position, employment_type, start_date, end_date, is_current, is_primary, base_monthly_income, overtime_monthly, bonus_monthly, commission_monthly, other_monthly",
          )
          .eq("borrower_profile_id", borrowerProfileId)
          .is("deleted_at", null)
          .order("start_date", { ascending: false });
      }),
    supabase
      .from("borrower_profiles")
      .select("id")
      .eq("loan_application_id", loanId)
      .eq("profile_id", loan.borrower_id)
      .maybeSingle()
      .then(async (result) => {
        const borrowerProfileId = result.data?.id;

        if (!borrowerProfileId) {
          return { data: [] as StaffLoanWorkspace["assets"], error: null };
        }

        return supabase
          .from("assets")
          .select("id, asset_type, institution_name, balance, is_gift, gift_source")
          .eq("borrower_profile_id", borrowerProfileId)
          .is("deleted_at", null);
      }),
    supabase
      .from("borrower_profiles")
      .select("id")
      .eq("loan_application_id", loanId)
      .eq("profile_id", loan.borrower_id)
      .maybeSingle()
      .then(async (result) => {
        const borrowerProfileId = result.data?.id;

        if (!borrowerProfileId) {
          return { data: [] as StaffLoanWorkspace["liabilities"], error: null };
        }

        return supabase
          .from("liabilities")
          .select(
            "id, liability_type, creditor_name, monthly_payment, outstanding_balance, months_remaining, to_be_paid_off, exclude_from_dti, exclude_reason",
          )
          .eq("borrower_profile_id", borrowerProfileId)
          .is("deleted_at", null);
      }),
    supabase
      .from("borrower_profiles")
      .select(
        "id, loan_application_id, dob, marital_status, citizenship, dependents_count, housing_status, monthly_housing_payment, years_at_address, declarations, address_current",
      )
      .eq("loan_application_id", loanId)
      .eq("profile_id", loan.borrower_id)
      .maybeSingle(),
    supabase
      .from("documents")
      .select(
        "id, document_type, document_category, file_name, storage_path, created_at, status, rejection_reason, mime_type, uploaded_by, version, is_latest, parent_document_id, expires_at, file_size_bytes, ai_extracted_data",
      )
      .eq("loan_application_id", loanId)
      .eq("is_latest", true)
      .is("deleted_at", null)
      .order("document_type", { ascending: true }),
    supabase
      .from("document_requests")
      .select("id, document_type, message, due_date, status, created_at, fulfilled_at")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("conditions")
      .select(
        "id, condition_type, description, status, source, due_date, assigned_to, waived_reason, document_id",
      )
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("condition_type", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("tasks")
      .select(
        "id, title, description, status, due_date, priority, task_type, assigned_to",
      )
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("status", { ascending: true })
      .order("due_date", { ascending: true }),
    supabase
      .from("messages")
      .select("id, body, created_at, sender_id, is_internal")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("underwriting_decisions")
      .select(
        "id, decision, decided_at, approved_amount, dti_ratio, ltv_ratio, cltv_ratio, credit_score_used, notes, denial_reasons, ai_summary, underwriter_id",
      )
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("decided_at", { ascending: false }),
    supabase
      .from("ai_analyses")
      .select("id, analysis_type, created_at, status, confidence_score, error_message, result")
      .eq("loan_application_id", loanId)
      .order("created_at", { ascending: false }),
    supabase
      .from("credit_reports")
      .select("id, score, pulled_at")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("pulled_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("audit_logs")
      .select("id, action, created_at, actor_id, after_state")
      .eq("organization_id", profile.organization_id)
      .eq("resource_id", loanId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const stageHistoryActorMap = await getNameMap(
    supabase,
    [...new Set((auditData.data ?? []).map((item) => item.actor_id).filter(Boolean) as string[])],
    profile.organization_id,
  );

  const uploaderMap = await getNameMap(
    supabase,
    [...new Set((documentsData.data ?? []).map((doc) => doc.uploaded_by))],
    profile.organization_id,
  );

  const assigneeMap = await getNameMap(
    supabase,
    [
      ...new Set([
        ...(conditionsData.data ?? []).map((condition) => condition.assigned_to).filter(Boolean),
        ...(tasksData.data ?? []).map((task) => task.assigned_to).filter(Boolean),
        ...(messagesData.data ?? []).map((message) => message.sender_id).filter(Boolean),
        ...(underwritingData.data ?? []).map((decision) => decision.underwriter_id).filter(Boolean),
      ] as string[]),
    ],
    profile.organization_id,
  );

  const documentNameMap = new Map(
    (documentsData.data ?? []).map((document) => [document.id, document.file_name]),
  );

  const borrowerName = borrowerData.data
    ? `${borrowerData.data.first_name} ${borrowerData.data.last_name}`.trim()
    : "Unknown borrower";

  const grossIncome = (employmentData.data ?? []).reduce((sum, employer) => {
    return (
      sum +
      Number(employer.base_monthly_income ?? 0) +
      Number(employer.overtime_monthly ?? 0) +
      Number(employer.bonus_monthly ?? 0) +
      Number(employer.commission_monthly ?? 0) +
      Number(employer.other_monthly ?? 0)
    );
  }, 0);

  const monthlyHousing = Number(borrowerProfileData.data?.monthly_housing_payment ?? 0);
  const monthlyDebt = (liabilityData.data ?? []).reduce((sum, liability) => {
    if (liability.exclude_from_dti || liability.to_be_paid_off) {
      return sum;
    }

    return sum + Number(liability.monthly_payment ?? 0);
  }, 0);

  const propertyValue =
    propertyData.data?.appraised_value ??
    propertyData.data?.estimated_value ??
    propertyData.data?.purchase_price ??
    null;
  const documents = (documentsData.data ?? []).map((document) => ({
    id: document.id,
    document_type: document.document_type,
    document_category: document.document_category,
    file_name: document.file_name,
    storage_path: document.storage_path,
    created_at: document.created_at,
    status: document.status,
    version: document.version ?? 1,
    is_latest: document.is_latest ?? false,
    parent_document_id: document.parent_document_id,
    expires_at: document.expires_at,
    uploaded_by_name: uploaderMap.get(document.uploaded_by)?.name ?? "Unknown user",
    rejection_reason: document.rejection_reason,
    mime_type: document.mime_type,
    file_size_bytes: document.file_size_bytes,
    ai_extracted_data: parseDocumentExtractionResult(document.ai_extracted_data),
  }));
  const documentChecklist = getDocumentChecklist(loan.loan_type, documents);
  const documentChecklistCompleted = documentChecklist.filter((item) => item.is_complete).length;

  return {
    header: {
      id: loan.id,
      organization_id: loan.organization_id,
      loan_number: loan.loan_number,
      status: loan.status,
      loan_amount: loan.loan_amount,
      loan_type: loan.loan_type,
      loan_purpose: loan.loan_purpose,
      borrower_name: borrowerName,
    },
    stage: stageData.data ?? null,
    stages: allStagesData.data ?? [],
    borrowerProfile: borrowerProfileData.data ?? null,
    employmentRecords: employmentData.data ?? [],
    assets: assetData.data ?? [],
    liabilities: liabilityData.data ?? [],
    property: propertyData.data ?? null,
    documents,
    documentRequests: documentRequestsData.data ?? [],
    documentChecklist: {
      completed: documentChecklistCompleted,
      total: documentChecklist.length,
      percent: documentChecklist.length
        ? Math.round((documentChecklistCompleted / documentChecklist.length) * 100)
        : 0,
      items: documentChecklist,
    },
    expiringDocuments: getExpiringDocuments(
      documents
        .filter((document) => document.status === "accepted")
        .map((document) => ({
          id: document.id,
          document_type: document.document_type,
          file_name: document.file_name,
          expires_at: document.expires_at,
        })),
    ),
    conditions: (conditionsData.data ?? []).map((condition) => ({
      id: condition.id,
      condition_type: condition.condition_type,
      description: condition.description,
      status: condition.status,
      source: condition.source,
      due_date: condition.due_date,
      assigned_to: condition.assigned_to,
      assigned_to_name: condition.assigned_to
        ? assigneeMap.get(condition.assigned_to)?.name ?? null
        : null,
      document_name: condition.document_id ? documentNameMap.get(condition.document_id) ?? null : null,
      waived_reason: condition.waived_reason,
    })),
    tasks: (tasksData.data ?? []).map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      due_date: task.due_date,
      priority: task.priority,
      task_type: task.task_type,
      assigned_to: task.assigned_to,
      assigned_to_name: task.assigned_to ? assigneeMap.get(task.assigned_to)?.name ?? null : null,
    })),
    messages: (messagesData.data ?? []).map((message) => ({
      id: message.id,
      body: message.body,
      created_at: message.created_at,
      sender_id: message.sender_id,
      sender_name: assigneeMap.get(message.sender_id)?.name ?? "Unknown user",
      sender_role: assigneeMap.get(message.sender_id)?.role ?? "staff",
      is_internal: message.is_internal,
    })),
    underwritingDecisions: (underwritingData.data ?? []).map((decision) => ({
      id: decision.id,
      decision: decision.decision,
      decided_at: decision.decided_at,
      approved_amount: decision.approved_amount,
      dti_ratio: decision.dti_ratio,
      ltv_ratio: decision.ltv_ratio,
      cltv_ratio: decision.cltv_ratio,
      credit_score_used: decision.credit_score_used,
      notes: decision.notes,
      denial_reasons: decision.denial_reasons,
      ai_summary: decision.ai_summary,
      underwriter_name: decision.underwriter_id
        ? assigneeMap.get(decision.underwriter_id)?.name ?? null
        : null,
    })),
    aiAnalyses: (aiData.data ?? []).map((analysis) => ({
      ...analysis,
      parsed_underwriting:
        analysis.analysis_type === "underwriting_summary"
          ? parseUnderwritingSummaryResult(analysis.result)
          : null,
      parsed_risk_assessment:
        analysis.analysis_type === "risk_assessment"
          ? parseRiskAssessmentResult(analysis.result)
          : null,
    })),
    latestCreditReport: creditData.data
      ? {
          id: creditData.data.id,
          score: creditData.data.score,
          pulled_at: creditData.data.pulled_at,
        }
      : null,
    ratios: {
      dti: grossIncome > 0 ? (monthlyDebt + monthlyHousing) / grossIncome : null,
      ltv:
        loan.loan_amount && propertyValue && propertyValue > 0
          ? Number(loan.loan_amount) / Number(propertyValue)
          : null,
      creditScore: creditData.data?.score ?? null,
    },
    counts: {
      conditions: conditionsData.data?.length ?? 0,
      tasks: tasksData.data?.length ?? 0,
      documents: documentsData.data?.length ?? 0,
    },
    stageHistory: (auditData.data ?? []).map((entry) => ({
      id: entry.id,
      action: entry.action,
      created_at: entry.created_at,
      actor_name: entry.actor_id ? stageHistoryActorMap.get(entry.actor_id)?.name ?? "System" : "System",
      after_state: entry.after_state,
    })),
    borrowerName,
    borrowerId: loan.borrower_id,
    staffMembers,
  };
}

export async function getStaffLoanDocumentDetail(
  loanId: string,
  docId: string,
): Promise<StaffLoanDocumentDetail> {
  const workspace = await getStaffLoanWorkspace(loanId);
  const { supabase } = await requireStaffContext();
  const [documentResult, requestsResult] = await Promise.all([
    supabase
      .from("documents")
      .select(
        "id, document_type, document_category, file_name, storage_path, created_at, status, rejection_reason, mime_type, uploaded_by, version, is_latest, parent_document_id, expires_at, file_size_bytes, ai_extracted_data",
      )
      .eq("id", docId)
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("document_requests")
      .select("id, document_type, message, due_date, status, created_at, fulfilled_at")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  if (documentResult.error) {
    throw new Error(documentResult.error.message);
  }

  if (!documentResult.data) {
    notFound();
  }

  const rootDocumentId = documentResult.data.parent_document_id ?? documentResult.data.id;
  const [versionsResult, signedUrlResult] = await Promise.all([
    supabase
      .from("documents")
      .select(
        "id, document_type, document_category, file_name, storage_path, created_at, status, rejection_reason, mime_type, uploaded_by, version, is_latest, parent_document_id, expires_at, file_size_bytes, ai_extracted_data",
      )
      .eq("loan_application_id", loanId)
      .or(`id.eq.${rootDocumentId},parent_document_id.eq.${rootDocumentId}`)
      .is("deleted_at", null)
      .order("version", { ascending: false }),
    supabase.storage.from("documents").createSignedUrl(documentResult.data.storage_path, 3600),
  ]);

  if (versionsResult.error) {
    throw new Error(versionsResult.error.message);
  }

  if (requestsResult.error) {
    throw new Error(requestsResult.error.message);
  }

  const uploaderMap = await getNameMap(
    supabase,
    [...new Set([
      ...(versionsResult.data ?? []).map((item) => item.uploaded_by),
      documentResult.data.uploaded_by,
    ])],
    workspace.header.organization_id,
  );

  const document = {
    id: documentResult.data.id,
    document_type: documentResult.data.document_type,
    document_category: documentResult.data.document_category,
    file_name: documentResult.data.file_name,
    storage_path: documentResult.data.storage_path,
    created_at: documentResult.data.created_at,
    status: documentResult.data.status,
    version: documentResult.data.version ?? 1,
    is_latest: documentResult.data.is_latest ?? false,
    parent_document_id: documentResult.data.parent_document_id,
    expires_at: documentResult.data.expires_at,
    uploaded_by_name: uploaderMap.get(documentResult.data.uploaded_by)?.name ?? "Unknown user",
    rejection_reason: documentResult.data.rejection_reason,
    mime_type: documentResult.data.mime_type,
    file_size_bytes: documentResult.data.file_size_bytes,
    ai_extracted_data: parseDocumentExtractionResult(documentResult.data.ai_extracted_data),
  };

  return {
    document,
    signedUrl: signedUrlResult.data?.signedUrl ?? null,
    versionHistory: (versionsResult.data ?? []).map((item) => ({
      id: item.id,
      document_type: item.document_type,
      document_category: item.document_category,
      file_name: item.file_name,
      storage_path: item.storage_path,
      created_at: item.created_at,
      status: item.status,
      version: item.version ?? 1,
      is_latest: item.is_latest ?? false,
      parent_document_id: item.parent_document_id,
      expires_at: item.expires_at,
      uploaded_by_name: uploaderMap.get(item.uploaded_by)?.name ?? "Unknown user",
      rejection_reason: item.rejection_reason,
      mime_type: item.mime_type,
      file_size_bytes: item.file_size_bytes,
      ai_extracted_data: parseDocumentExtractionResult(item.ai_extracted_data),
    })),
    requestHistory: (requestsResult.data ?? []).filter(
      (request) => request.document_type === document.document_type,
    ),
    loan: {
      id: loanId,
      loan_number: workspace.header.loan_number,
      borrower_name: workspace.borrowerName,
    },
  };
}
