import { cache } from "react";
import { redirect } from "next/navigation";

import { parseComplianceCheckResult } from "@/lib/ai/results";
import { calculateDisclosureDeadline, getDeadlineTone } from "@/lib/compliance/trid";
import { checkQMEligibility, getAporBaseline } from "@/lib/compliance/qm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AdminComplianceOverview,
  AuditLogPage,
  DisclosureRecord,
  HMDARecordSummary,
  LoanComplianceWorkspace,
} from "@/types/compliance";

async function requireStaffContext() {
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

  if (
    profileError ||
    !profile ||
    !["loan_officer", "processor", "underwriter", "admin"].includes(profile.role)
  ) {
    redirect("/login");
  }

  return { supabase, profile };
}

async function requireAdminContext() {
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

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/login");
  }

  return { supabase, profile };
}

async function getActorMap(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  organizationId: string,
  actorIds: string[],
) {
  if (!actorIds.length) {
    return new Map<string, { name: string; role: string | null }>();
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role")
    .eq("organization_id", organizationId)
    .in("id", actorIds);

  return new Map(
    (data ?? []).map((actor) => [
      actor.id,
      { name: `${actor.first_name} ${actor.last_name}`.trim(), role: actor.role },
    ]),
  );
}

export const getStaffLoanComplianceWorkspace = cache(async (loanId: string): Promise<LoanComplianceWorkspace> => {
  const { supabase, profile } = await requireStaffContext();
  const [
    loanResult,
    disclosuresResult,
    hmdaResult,
    auditResult,
    pricingResult,
    complianceAiResult,
  ] = await Promise.all([
    supabase
      .from("loan_applications")
      .select(
        "id, organization_id, borrower_id, loan_number, status, loan_amount, loan_type, loan_purpose, submitted_at, estimated_closing, term_months",
      )
      .eq("id", loanId)
      .eq("organization_id", profile.organization_id)
      .single(),
    supabase
      .from("disclosures")
      .select("id, disclosure_type, version, status, sent_at, deadline, acknowledged_at, notes, document_id")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("hmda_records")
      .select("id, action_taken, action_taken_date, census_tract, county_code, msa_code, reporting_year, rate_spread, hoepa_status, denial_reasons")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("audit_logs")
      .select("id, created_at, actor_id, action, resource_type, before_state, after_state")
      .eq("organization_id", profile.organization_id)
      .eq("resource_id", loanId)
      .order("created_at", { ascending: false })
      .limit(12),
    Promise.all([
      supabase
        .from("rate_locks")
        .select("apr, points, loan_product_id")
        .eq("loan_application_id", loanId)
        .is("deleted_at", null)
        .order("locked_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("loan_products")
        .select("id, amortization_type")
        .is("deleted_at", null),
      supabase
        .from("underwriting_decisions")
        .select("id, decision, decided_at, dti_ratio, denial_reasons, ai_summary")
        .eq("loan_application_id", loanId)
        .is("deleted_at", null)
        .order("decided_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("properties")
        .select("property_type, address")
        .eq("loan_application_id", loanId)
        .is("deleted_at", null)
        .maybeSingle(),
    ]),
    supabase
      .from("ai_analyses")
      .select("id, status, created_at, result")
      .eq("loan_application_id", loanId)
      .eq("analysis_type", "compliance_check")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (loanResult.error || !loanResult.data) {
    redirect("/staff/pipeline");
  }

  const loan = loanResult.data;
  const { data: borrower } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", loan.borrower_id)
    .single();

  const actorMap = await getActorMap(
    supabase,
    profile.organization_id,
    [...new Set((auditResult.data ?? []).map((entry) => entry.actor_id).filter(Boolean) as string[])],
  );

  const disclosures = (disclosuresResult.data ?? []) as DisclosureRecord[];
  const latestLE = [...disclosures].reverse().find((disclosure) => disclosure.disclosure_type === "LE") ?? null;
  const latestCD = [...disclosures].reverse().find((disclosure) => disclosure.disclosure_type === "CD") ?? null;
  const leDeadline = calculateDisclosureDeadline({
    disclosureType: "LE",
    submittedAt: loan.submitted_at,
  });
  const cdDeadline = calculateDisclosureDeadline({
    disclosureType: "CD",
    closingDate: loan.estimated_closing,
  });

  const [rateLockResult, loanProductsResult, uwDecisionResult] = pricingResult;
  const amortizationType =
    loanProductsResult.data?.find((product) => product.id === rateLockResult.data?.loan_product_id)?.amortization_type ??
    "fixed";
  const apor = getAporBaseline(loan.loan_type);
  const qm = checkQMEligibility({
    dti: uwDecisionResult.data?.dti_ratio ?? null,
    points: rateLockResult.data?.points !== null && rateLockResult.data?.points !== undefined ? Number(rateLockResult.data.points) : null,
    termMonths: loan.term_months ?? 360,
    amortizationType,
    loanAmount: loan.loan_amount ?? null,
    apr: rateLockResult.data?.apr !== null && rateLockResult.data?.apr !== undefined ? Number(rateLockResult.data.apr) : null,
    apor,
  });

  return {
    loan: {
      id: loan.id,
      loan_number: loan.loan_number,
      status: loan.status,
      loan_amount: loan.loan_amount,
      loan_type: loan.loan_type,
      loan_purpose: loan.loan_purpose,
      submitted_at: loan.submitted_at,
      estimated_closing: loan.estimated_closing,
      borrower_name: borrower ? `${borrower.first_name} ${borrower.last_name}`.trim() : "Unknown borrower",
    },
    trid: {
      milestones: [
        {
          key: "application",
          label: "Application submitted",
          due_at: loan.submitted_at,
          sent_at: loan.submitted_at,
          acknowledged_at: loan.submitted_at,
          tone: "success",
          helper: "Application start date used for LE timing.",
        },
        {
          key: "le",
          label: "Loan Estimate",
          due_at: leDeadline?.toISOString() ?? null,
          sent_at: latestLE?.sent_at ?? null,
          acknowledged_at: latestLE?.acknowledged_at ?? null,
          tone: getDeadlineTone(leDeadline?.toISOString() ?? null, latestLE?.acknowledged_at ?? null),
          helper: "Must be sent within 3 business days of application.",
        },
        {
          key: "intent",
          label: "Intent to proceed",
          due_at: null,
          sent_at: latestLE?.acknowledged_at ?? null,
          acknowledged_at: latestLE?.acknowledged_at ?? null,
          tone: latestLE?.acknowledged_at ? "success" : "neutral",
          helper: "Borrower acknowledgment is used as intent to proceed.",
        },
        {
          key: "cd",
          label: "Closing Disclosure",
          due_at: cdDeadline?.toISOString() ?? null,
          sent_at: latestCD?.sent_at ?? null,
          acknowledged_at: latestCD?.acknowledged_at ?? null,
          tone: getDeadlineTone(cdDeadline?.toISOString() ?? null, latestCD?.acknowledged_at ?? null),
          helper: "Must be sent 3 business days before closing.",
        },
        {
          key: "closing",
          label: "Estimated closing",
          due_at: loan.estimated_closing ? new Date(loan.estimated_closing).toISOString() : null,
          sent_at: loan.estimated_closing ? new Date(loan.estimated_closing).toISOString() : null,
          acknowledged_at: null,
          tone: "neutral",
          helper: "Current target closing date on the loan file.",
        },
      ],
      disclosures,
      intent_to_proceed_at: latestLE?.acknowledged_at ?? null,
    },
    qm,
    hmda: hmdaResult.data as HMDARecordSummary | null,
    complianceAnalysis: complianceAiResult.data
      ? {
          id: complianceAiResult.data.id,
          status: complianceAiResult.data.status,
          created_at: complianceAiResult.data.created_at,
          result: complianceAiResult.data.result,
        }
      : null,
    recentAudit: (auditResult.data ?? []).map((entry) => ({
      id: entry.id,
      created_at: entry.created_at,
      action: entry.action,
      actor_name: entry.actor_id ? actorMap.get(entry.actor_id)?.name ?? "System" : "System",
      resource_type: entry.resource_type,
      before_state: entry.before_state,
      after_state: entry.after_state,
    })),
  };
});

export async function getAdminComplianceOverview(): Promise<AdminComplianceOverview> {
  const { supabase, profile } = await requireAdminContext();
  const today = new Date().toISOString();
  const currentYear = new Date().getFullYear();
  const { data: orgLoans, error: orgLoansError } = await supabase
    .from("loan_applications")
    .select("id, loan_number, borrower_id, status")
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (orgLoansError) {
    throw new Error(orgLoansError.message);
  }

  const loanIds = (orgLoans ?? []).map((loan) => loan.id);
  const [dueSoonResult, overdueResult, hmdaResult, aiResult] = loanIds.length ? await Promise.all([
    supabase
      .from("disclosures")
      .select("id, loan_application_id, disclosure_type, deadline, status", { count: "exact" })
      .in("loan_application_id", loanIds)
      .is("deleted_at", null)
      .in("status", ["draft", "sent"])
      .gte("deadline", today)
      .order("deadline", { ascending: true })
      .limit(10),
    supabase
      .from("disclosures")
      .select("id", { count: "exact", head: true })
      .in("loan_application_id", loanIds)
      .is("deleted_at", null)
      .lt("deadline", today)
      .in("status", ["draft", "sent"]),
    supabase
      .from("hmda_records")
      .select("id, action_taken, action_taken_date, census_tract, county_code, msa_code, reporting_year, rate_spread, hoepa_status, denial_reasons")
      .eq("organization_id", profile.organization_id)
      .eq("reporting_year", currentYear)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("ai_analyses")
      .select("loan_application_id, status, result")
      .eq("analysis_type", "compliance_check")
      .eq("status", "completed")
      .in("loan_application_id", loanIds)
      .order("created_at", { ascending: false })
      .limit(25),
  ]) : [
    { data: [], count: 0 },
    { count: 0 },
    { data: [] },
    { data: [] },
  ];

  const borrowerIds = [...new Set((orgLoans ?? []).map((loan) => loan.borrower_id))];
  const actorMap = await getActorMap(supabase, profile.organization_id, borrowerIds);
  const loanMap = new Map((orgLoans ?? []).map((loan) => [loan.id, loan]));

  const flaggedLoans = (aiResult.data ?? [])
    .map((row) => {
      const compliance = parseComplianceCheckResult(row.result);
      if (!compliance || compliance.compliance_status === "clear") {
        return null;
      }

      const loan = loanMap.get(row.loan_application_id);
      const loanNumber = loan?.loan_number ?? null;
      const borrowerId = loan?.borrower_id ?? null;

      return {
        loan_application_id: row.loan_application_id,
        loan_number: loanNumber,
        borrower_name: borrowerId ? actorMap.get(borrowerId)?.name ?? "Unknown borrower" : "Unknown borrower",
        qm_status: "non_qm" as const,
        compliance_status: compliance.compliance_status,
      };
    })
    .filter(Boolean) as AdminComplianceOverview["flaggedLoans"];

  return {
    metrics: [
      {
        label: "Upcoming disclosures",
        value: dueSoonResult.count ?? (dueSoonResult.data?.length ?? 0),
        helper: "LE/CD files still open with future deadlines",
      },
      {
        label: "Overdue disclosures",
        value: overdueResult.count ?? 0,
        helper: "Deadlines already missed and still unresolved",
      },
      {
        label: "HMDA records",
        value: hmdaResult.data?.length ?? 0,
        helper: `Records captured for ${currentYear}`,
      },
      {
        label: "Compliance flags",
        value: flaggedLoans.length,
        helper: "Latest AI review marked clear exceptions or flags",
      },
    ],
    upcomingDisclosures: (dueSoonResult.data ?? []).map((row) => ({
      id: row.id,
      loan_application_id: row.loan_application_id,
      loan_number: loanMap.get(row.loan_application_id)?.loan_number ?? null,
      disclosure_type: row.disclosure_type,
      deadline: row.deadline,
      status: row.status,
    })),
    hmdaRecords: (hmdaResult.data ?? []) as HMDARecordSummary[],
    flaggedLoans,
  };
}

type AuditFilterInput = {
  page?: number;
  pageSize?: number;
  action?: string;
  actor?: string;
  resource?: string;
  from?: string;
  to?: string;
};

export async function getAdminAuditLogs(filters: AuditFilterInput): Promise<AuditLogPage> {
  const { supabase, profile } = await requireAdminContext();
  const page = Math.max(1, Number(filters.page ?? 1));
  const pageSize = Math.min(100, Math.max(10, Number(filters.pageSize ?? 25)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("audit_logs")
    .select("id, created_at, actor_id, action, resource_type, resource_id, before_state, after_state", {
      count: "exact",
    })
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (filters.action) {
    query = query.ilike("action", `%${filters.action}%`);
  }

  if (filters.resource) {
    query = query.ilike("resource_type", `%${filters.resource}%`);
  }

  if (filters.from) {
    query = query.gte("created_at", filters.from);
  }

  if (filters.to) {
    query = query.lte("created_at", `${filters.to}T23:59:59.999Z`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const actorMap = await getActorMap(
    supabase,
    profile.organization_id,
    [...new Set((data ?? []).map((row) => row.actor_id).filter(Boolean) as string[])],
  );

  const rows = (data ?? [])
    .map((row) => ({
      id: row.id,
      created_at: row.created_at,
      actor_name: row.actor_id ? actorMap.get(row.actor_id)?.name ?? "System" : "System",
      actor_role: row.actor_id ? actorMap.get(row.actor_id)?.role ?? null : null,
      action: row.action,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      before_state: row.before_state,
      after_state: row.after_state,
    }))
    .filter((row) => {
      if (!filters.actor) {
        return true;
      }

      return row.actor_name.toLowerCase().includes(filters.actor.toLowerCase());
    });

  return {
    rows,
    totalCount: count ?? rows.length,
    page,
    pageSize,
    filters: {
      action: filters.action,
      actor: filters.actor,
      resource: filters.resource,
      from: filters.from,
      to: filters.to,
    },
  };
}
