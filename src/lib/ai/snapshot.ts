import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function safeNumber(value: number | null | undefined) {
  return Number(value ?? 0);
}

function calculateYearsEmployed(
  employmentRecords: Array<{ start_date: string | null; is_current: boolean }>,
) {
  const currentEmployment = employmentRecords
    .filter((record) => record.is_current && record.start_date)
    .sort((a, b) => new Date(a.start_date ?? 0).getTime() - new Date(b.start_date ?? 0).getTime())[0];

  if (!currentEmployment?.start_date) {
    return 0;
  }

  const diffMs = Date.now() - new Date(currentEmployment.start_date).getTime();
  return Math.max(0, Math.round((diffMs / (1000 * 60 * 60 * 24 * 365)) * 10) / 10);
}

function estimatedPITI(params: {
  loanAmount: number;
  termMonths: number;
}) {
  const rate = 0.07;
  const monthlyRate = rate / 12;
  const monthlyPI =
    (params.loanAmount * monthlyRate) /
    (1 - Math.pow(1 + monthlyRate, -Math.max(params.termMonths, 1)));

  return monthlyPI * 1.25;
}

export interface ApplicationSnapshot {
  loan: {
    amount: number;
    purpose: string;
    type: string;
    term_months: number;
    down_payment: number;
    ltv: number;
    estimated_dti: number;
  };
  property: {
    property_type: string | null;
    occupancy_type: string | null;
    purchase_price: number;
    estimated_value: number;
    appraised_value: number;
  };
  borrower: {
    marital_status: string | null;
    citizenship: string | null;
    years_at_address: number;
    housing_status: string | null;
    monthly_housing_payment: number;
    dependents_count: number;
    years_employed: number;
    employment_type: string | null;
    total_monthly_income: number;
    total_assets: number;
    total_monthly_debts: number;
    months_reserves: number;
    credit_score: number | null;
  };
  employment_records: Array<{
    employment_type: string;
    is_current: boolean;
    is_primary: boolean;
    base_monthly_income: number;
    overtime_monthly: number;
    bonus_monthly: number;
    commission_monthly: number;
    start_date: string | null;
  }>;
  assets: Array<{
    asset_type: string;
    balance: number;
    is_gift: boolean;
  }>;
  liabilities: Array<{
    liability_type: string;
    monthly_payment: number;
    outstanding_balance: number;
    to_be_paid_off: boolean;
  }>;
}

export async function buildApplicationSnapshot(loanId: string): Promise<ApplicationSnapshot> {
  const admin = createSupabaseAdminClient();
  const { data: loan, error } = await admin
    .from("loan_applications")
    .select("id, borrower_id, loan_amount, loan_purpose, loan_type, down_payment, term_months")
    .eq("id", loanId)
    .single();

  if (error || !loan) {
    throw new Error(error?.message ?? "Loan not found for AI analysis.");
  }

  const [
    propertyResult,
    borrowerProfileResult,
    creditReportResult,
  ] = await Promise.all([
    admin
      .from("properties")
      .select("property_type, occupancy_type, purchase_price, estimated_value, appraised_value")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .maybeSingle(),
    admin
      .from("borrower_profiles")
      .select(
        "id, marital_status, citizenship, years_at_address, housing_status, monthly_housing_payment, dependents_count",
      )
      .eq("loan_application_id", loanId)
      .eq("profile_id", loan.borrower_id)
      .is("deleted_at", null)
      .maybeSingle(),
    admin
      .from("credit_reports")
      .select("score")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("pulled_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const borrowerProfileId = borrowerProfileResult.data?.id;

  const [employmentResult, assetsResult, liabilitiesResult] = borrowerProfileId
    ? await Promise.all([
        admin
          .from("employment_records")
          .select(
            "employment_type, is_current, is_primary, base_monthly_income, overtime_monthly, bonus_monthly, commission_monthly, start_date",
          )
          .eq("borrower_profile_id", borrowerProfileId)
          .is("deleted_at", null),
        admin
          .from("assets")
          .select("asset_type, balance, is_gift")
          .eq("borrower_profile_id", borrowerProfileId)
          .is("deleted_at", null),
        admin
          .from("liabilities")
          .select("liability_type, monthly_payment, outstanding_balance, to_be_paid_off")
          .eq("borrower_profile_id", borrowerProfileId)
          .is("deleted_at", null),
      ])
    : [
        { data: [] as ApplicationSnapshot["employment_records"] },
        { data: [] as ApplicationSnapshot["assets"] },
        { data: [] as ApplicationSnapshot["liabilities"] },
      ];

  const totalMonthlyIncome = (employmentResult.data ?? [])
    .filter((record) => record.is_current)
    .reduce((sum, record) => {
      return (
        sum +
        safeNumber(record.base_monthly_income) +
        safeNumber(record.overtime_monthly) +
        safeNumber(record.bonus_monthly) +
        safeNumber(record.commission_monthly)
      );
    }, 0);

  const totalMonthlyDebts = (liabilitiesResult.data ?? [])
    .filter((record) => !record.to_be_paid_off)
    .reduce((sum, record) => sum + safeNumber(record.monthly_payment), 0);

  const totalAssets = (assetsResult.data ?? []).reduce(
    (sum, record) => sum + safeNumber(record.balance),
    0,
  );

  const loanAmount = safeNumber(loan.loan_amount);
  const termMonths = Math.max(Number(loan.term_months ?? 360), 1);
  const purchaseOrValue =
    safeNumber(propertyResult.data?.appraised_value) ||
    safeNumber(propertyResult.data?.estimated_value) ||
    safeNumber(propertyResult.data?.purchase_price) ||
    1;
  const piti = estimatedPITI({ loanAmount, termMonths });
  const ltv = loanAmount / purchaseOrValue;
  const dti = totalMonthlyIncome > 0 ? (totalMonthlyDebts + piti) / totalMonthlyIncome : 0;

  return {
    loan: {
      amount: loanAmount,
      purpose: loan.loan_purpose,
      type: loan.loan_type,
      term_months: termMonths,
      down_payment: safeNumber(loan.down_payment),
      ltv: Math.round(ltv * 1000) / 10,
      estimated_dti: Math.round(dti * 1000) / 10,
    },
    property: {
      property_type: propertyResult.data?.property_type ?? null,
      occupancy_type: propertyResult.data?.occupancy_type ?? null,
      purchase_price: safeNumber(propertyResult.data?.purchase_price),
      estimated_value: safeNumber(propertyResult.data?.estimated_value),
      appraised_value: safeNumber(propertyResult.data?.appraised_value),
    },
    borrower: {
      marital_status: borrowerProfileResult.data?.marital_status ?? null,
      citizenship: borrowerProfileResult.data?.citizenship ?? null,
      years_at_address: Number(borrowerProfileResult.data?.years_at_address ?? 0),
      housing_status: borrowerProfileResult.data?.housing_status ?? null,
      monthly_housing_payment: safeNumber(borrowerProfileResult.data?.monthly_housing_payment),
      dependents_count: Number(borrowerProfileResult.data?.dependents_count ?? 0),
      years_employed: calculateYearsEmployed(employmentResult.data ?? []),
      employment_type: employmentResult.data?.find((record) => record.is_primary)?.employment_type ?? null,
      total_monthly_income: totalMonthlyIncome,
      total_assets: totalAssets,
      total_monthly_debts: totalMonthlyDebts,
      months_reserves: piti > 0 ? Math.round((totalAssets / piti) * 10) / 10 : 0,
      credit_score: creditReportResult.data?.score ?? null,
    },
    employment_records: (employmentResult.data ?? []).map((record) => ({
      employment_type: record.employment_type,
      is_current: record.is_current,
      is_primary: record.is_primary,
      base_monthly_income: safeNumber(record.base_monthly_income),
      overtime_monthly: safeNumber(record.overtime_monthly),
      bonus_monthly: safeNumber(record.bonus_monthly),
      commission_monthly: safeNumber(record.commission_monthly),
      start_date: record.start_date,
    })),
    assets: (assetsResult.data ?? []).map((asset) => ({
      asset_type: asset.asset_type,
      balance: safeNumber(asset.balance),
      is_gift: asset.is_gift,
    })),
    liabilities: (liabilitiesResult.data ?? []).map((liability) => ({
      liability_type: liability.liability_type,
      monthly_payment: safeNumber(liability.monthly_payment),
      outstanding_balance: safeNumber(liability.outstanding_balance),
      to_be_paid_off: liability.to_be_paid_off,
    })),
  };
}
