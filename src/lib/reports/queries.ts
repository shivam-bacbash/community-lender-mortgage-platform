import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PipelineVelocityRow {
  stage_name: string;
  stage_order: number;
  loan_count: number;
  avg_days: number;
}

export interface LOProductionRow {
  lo_name: string;
  applications: number;
  funded: number;
  total_volume: number;
  pull_through_rate: number;
}

export interface ApplicationFunnelRow {
  stage_name: string;
  stage_order: number;
  count: number;
  conversion_rate: number;
}

export interface HMDARecord {
  id: string;
  loan_application_id: string;
  reporting_year: number;
  action_taken: number | null;
  action_taken_date: string | null;
  census_tract: string | null;
  county_code: string | null;
  lien_status: number | null;
  loan_purpose_hmda: number | null;
  property_type_hmda: number | null;
  ethnicity_data: unknown;
  race_data: unknown;
  sex_data: unknown;
  rate_spread: number | null;
  hoepa_status: number | null;
  loan_amount: number | null;
  loan_type: string | null;
  loan_purpose: string | null;
}

export interface ReportSummary {
  total_loans: number;
  funded_ytd: number;
  total_volume_ytd: number;
  avg_days_to_close: number;
}

async function requireAdminContext(): Promise<{
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  orgId: string;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authentication required.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return { supabase, orgId: profile.organization_id };
}

export async function getPipelineVelocity(
  orgId: string,
  startDate: string,
  endDate: string,
): Promise<PipelineVelocityRow[]> {
  const supabase = await createSupabaseServerClient();

  const [stagesResult, loansResult] = await Promise.all([
    supabase
      .from("pipeline_stages")
      .select("id, name, order_index")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("order_index", { ascending: true }),
    supabase
      .from("loan_applications")
      .select("id, pipeline_stage_id, submitted_at, updated_at")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .gte("created_at", startDate)
      .lte("created_at", endDate),
  ]);

  const stages = stagesResult.data ?? [];
  const loans = loansResult.data ?? [];

  // Group loans by pipeline_stage_id and calculate avg days in stage
  const stageMap = new Map<
    string,
    { name: string; order: number; loans: typeof loans }
  >();

  for (const stage of stages) {
    stageMap.set(stage.id, { name: stage.name, order: stage.order_index, loans: [] });
  }

  for (const loan of loans) {
    if (loan.pipeline_stage_id && stageMap.has(loan.pipeline_stage_id)) {
      stageMap.get(loan.pipeline_stage_id)!.loans.push(loan);
    }
  }

  return Array.from(stageMap.entries())
    .map(([, stageData]) => {
      const loanCount = stageData.loans.length;
      let totalDays = 0;

      for (const loan of stageData.loans) {
        const ref = loan.submitted_at ?? loan.updated_at;
        const days = Math.max(
          0,
          Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24)),
        );
        totalDays += days;
      }

      const avgDays = loanCount > 0 ? Math.round(totalDays / loanCount) : 0;

      return {
        stage_name: stageData.name,
        stage_order: stageData.order,
        loan_count: loanCount,
        avg_days: avgDays,
      };
    })
    .sort((a, b) => a.stage_order - b.stage_order);
}

export async function getLOProduction(
  orgId: string,
  startDate: string,
  endDate: string,
): Promise<LOProductionRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data: loans } = await supabase
    .from("loan_applications")
    .select("id, loan_officer_id, status, loan_amount")
    .eq("organization_id", orgId)
    .is("deleted_at", null)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .not("loan_officer_id", "is", null);

  if (!loans || loans.length === 0) {
    return [];
  }

  const loIds = [...new Set(loans.map((l) => l.loan_officer_id).filter(Boolean) as string[])];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", loIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`.trim()]),
  );

  const loStats = new Map<
    string,
    { applications: number; funded: number; total_volume: number }
  >();

  for (const loan of loans) {
    if (!loan.loan_officer_id) continue;

    const existing = loStats.get(loan.loan_officer_id) ?? {
      applications: 0,
      funded: 0,
      total_volume: 0,
    };

    existing.applications += 1;

    if (loan.status === "funded") {
      existing.funded += 1;
      existing.total_volume += Number(loan.loan_amount ?? 0);
    }

    loStats.set(loan.loan_officer_id, existing);
  }

  return Array.from(loStats.entries())
    .map(([loId, stats]) => ({
      lo_name: profileMap.get(loId) ?? "Unknown",
      applications: stats.applications,
      funded: stats.funded,
      total_volume: stats.total_volume,
      pull_through_rate:
        stats.applications > 0 ? stats.funded / stats.applications : 0,
    }))
    .sort((a, b) => b.total_volume - a.total_volume);
}

export async function getApplicationFunnel(
  orgId: string,
  startDate: string,
  endDate: string,
): Promise<ApplicationFunnelRow[]> {
  const supabase = await createSupabaseServerClient();

  const [stagesResult, loansResult] = await Promise.all([
    supabase
      .from("pipeline_stages")
      .select("id, name, order_index")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("order_index", { ascending: true }),
    supabase
      .from("loan_applications")
      .select("id, pipeline_stage_id")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .gte("created_at", startDate)
      .lte("created_at", endDate),
  ]);

  const stages = stagesResult.data ?? [];
  const loans = loansResult.data ?? [];

  // Count loans per stage
  const countMap = new Map<string, number>();
  for (const loan of loans) {
    if (loan.pipeline_stage_id) {
      countMap.set(loan.pipeline_stage_id, (countMap.get(loan.pipeline_stage_id) ?? 0) + 1);
    }
  }

  const rows = stages.map((stage) => ({
    stage_name: stage.name,
    stage_order: stage.order_index,
    count: countMap.get(stage.id) ?? 0,
    conversion_rate: 0,
  }));

  // Calculate conversion_rate relative to first stage
  const maxCount = rows[0]?.count ?? 1;
  return rows.map((row) => ({
    ...row,
    conversion_rate: maxCount > 0 ? row.count / maxCount : 0,
  }));
}

export async function getHMDARecords(
  orgId: string,
  year: number,
): Promise<HMDARecord[]> {
  const supabase = await createSupabaseServerClient();

  const { data: records } = await supabase
    .from("hmda_records")
    .select(
      `id, loan_application_id, reporting_year, action_taken, action_taken_date,
       census_tract, county_code, lien_status, loan_purpose_hmda,
       property_type_hmda, ethnicity_data, race_data, sex_data,
       rate_spread, hoepa_status,
       loan_applications!inner(loan_amount, loan_type, loan_purpose)`,
    )
    .eq("organization_id", orgId)
    .eq("reporting_year", year)
    .is("deleted_at", null);

  return (records ?? []).map((rec) => {
    const loanApp = (rec.loan_applications as unknown) as {
      loan_amount: number | null;
      loan_type: string | null;
      loan_purpose: string | null;
    } | null;

    return {
      id: rec.id,
      loan_application_id: rec.loan_application_id,
      reporting_year: rec.reporting_year,
      action_taken: rec.action_taken,
      action_taken_date: rec.action_taken_date,
      census_tract: rec.census_tract,
      county_code: rec.county_code,
      lien_status: rec.lien_status,
      loan_purpose_hmda: rec.loan_purpose_hmda,
      property_type_hmda: rec.property_type_hmda,
      ethnicity_data: rec.ethnicity_data,
      race_data: rec.race_data,
      sex_data: rec.sex_data,
      rate_spread: rec.rate_spread,
      hoepa_status: rec.hoepa_status,
      loan_amount: loanApp?.loan_amount ?? null,
      loan_type: loanApp?.loan_type ?? null,
      loan_purpose: loanApp?.loan_purpose ?? null,
    };
  });
}

export async function getReportSummary(orgId: string): Promise<ReportSummary> {
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const ytdStart = new Date(now.getFullYear(), 0, 1).toISOString();

  const [totalResult, fundedResult] = await Promise.all([
    supabase
      .from("loan_applications")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .is("deleted_at", null),
    supabase
      .from("loan_applications")
      .select("loan_amount, submitted_at, funded_at")
      .eq("organization_id", orgId)
      .eq("status", "funded")
      .is("deleted_at", null)
      .gte("funded_at", ytdStart),
  ]);

  const fundedLoans = fundedResult.data ?? [];
  const totalVolumeYTD = fundedLoans.reduce(
    (sum, loan) => sum + Number(loan.loan_amount ?? 0),
    0,
  );

  // Avg days to close: funded_at - submitted_at
  let totalDaysToClose = 0;
  let closedWithDates = 0;

  for (const loan of fundedLoans) {
    if (loan.submitted_at && loan.funded_at) {
      const days =
        (new Date(loan.funded_at).getTime() - new Date(loan.submitted_at).getTime()) /
        (1000 * 60 * 60 * 24);
      if (days >= 0) {
        totalDaysToClose += days;
        closedWithDates += 1;
      }
    }
  }

  const avgDaysToClose =
    closedWithDates > 0 ? Math.round(totalDaysToClose / closedWithDates) : 0;

  return {
    total_loans: totalResult.count ?? 0,
    funded_ytd: fundedLoans.length,
    total_volume_ytd: totalVolumeYTD,
    avg_days_to_close: avgDaysToClose,
  };
}

export async function requireAdminReportContext(): Promise<string> {
  const { orgId } = await requireAdminContext();
  return orgId;
}
