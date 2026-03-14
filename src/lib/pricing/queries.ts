import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  applyDefaultFees,
  calculateRate,
  ensureDefaultPricingSetup,
} from "@/lib/pricing/calculator";
import type {
  PricingProduct,
  PricingRateSheet,
  StaffPricingWorkspace,
} from "@/types/pricing";

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

export async function getStaffPricingWorkspace(
  loanId: string,
): Promise<StaffPricingWorkspace> {
  const { supabase, profile } = await requireStaffContext();
  await ensureDefaultPricingSetup(profile.organization_id);

  const { data: loan, error: loanError } = await supabase
    .from("loan_applications")
    .select("id, organization_id, borrower_id, loan_number, loan_type, loan_amount, down_payment, term_months, status")
    .eq("id", loanId)
    .eq("organization_id", profile.organization_id)
    .single();

  if (loanError || !loan) {
    notFound();
  }

  await applyDefaultFees(loanId, loan.loan_type);

  const [
    borrowerData,
    propertyData,
    creditData,
    feesData,
    rateLockData,
  ] = await Promise.all([
    supabase.from("profiles").select("first_name, last_name").eq("id", loan.borrower_id).single(),
    supabase
      .from("properties")
      .select("occupancy_type, property_type, purchase_price, estimated_value, appraised_value")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("credit_reports")
      .select("id, score, pulled_at")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("pulled_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("loan_fees")
      .select("id, fee_type, fee_name, amount, paid_by, disclosure_section, tolerance_bucket")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("disclosure_section", { ascending: true }),
    supabase
      .from("rate_locks")
      .select("id, loan_product_id, rate, apr, points, lock_period_days, locked_at, expires_at, status")
      .eq("loan_application_id", loanId)
      .is("deleted_at", null)
      .order("locked_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const fees = (feesData.data ?? []).map((fee) => ({
    ...fee,
    amount: Number(fee.amount),
  }));
  const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const propertyValue =
    Number(
      propertyData.data?.appraised_value ??
        propertyData.data?.estimated_value ??
        propertyData.data?.purchase_price ??
        0,
    ) || null;
  const ltv =
    propertyValue && propertyValue > 0
      ? Number(loan.loan_amount ?? 0) / propertyValue
      : null;
  const pricingResult =
    creditData.data?.score && ltv !== null
      ? await calculateRate(
          {
            loanAmount: Number(loan.loan_amount ?? 0),
            creditScore: creditData.data.score,
            ltv,
            loanType: loan.loan_type,
            termMonths: Number(loan.term_months ?? 360),
            occupancyType: propertyData.data?.occupancy_type ?? "primary_residence",
            propertyType: propertyData.data?.property_type ?? "single_family",
          },
          profile.organization_id,
          totalFees,
        )
      : null;

  const bySectionMap = new Map<string, number>();
  for (const fee of fees) {
    const key = fee.disclosure_section ?? "Other";
    bySectionMap.set(key, (bySectionMap.get(key) ?? 0) + fee.amount);
  }

  return {
    loan: {
      id: loan.id,
      organization_id: loan.organization_id,
      loan_number: loan.loan_number,
      loan_type: loan.loan_type,
      loan_amount: Number(loan.loan_amount ?? 0),
      down_payment: Number(loan.down_payment ?? 0),
      term_months: Number(loan.term_months ?? 360),
      status: loan.status,
    },
    profile: {
      borrower_name: borrowerData.data
        ? `${borrowerData.data.first_name} ${borrowerData.data.last_name}`.trim()
        : "Unknown borrower",
      credit_score: creditData.data?.score ?? null,
      ltv,
      occupancy_type: propertyData.data?.occupancy_type ?? null,
      property_type: propertyData.data?.property_type ?? null,
    },
    pricingResult,
    fees,
    feeTotals: {
      bySection: Array.from(bySectionMap.entries()).map(([section, total]) => ({ section, total })),
      closingCosts: totalFees,
      cashToClose: Number(loan.down_payment ?? 0) + totalFees,
    },
    activeRateLock: rateLockData.data
      ? {
          ...rateLockData.data,
          rate: Number(rateLockData.data.rate),
          apr: rateLockData.data.apr !== null ? Number(rateLockData.data.apr) : null,
          points: rateLockData.data.points !== null ? Number(rateLockData.data.points) : null,
        }
      : null,
  };
}

export async function getAdminProductsList() {
  const { supabase, profile } = await requireAdminContext();
  await ensureDefaultPricingSetup(profile.organization_id);
  const { data, error } = await supabase
    .from("loan_products")
    .select("id, organization_id, name, loan_type, term_months, amortization_type, arm_initial_period, guidelines, description, is_active, display_order")
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return {
    profile,
    products: (data ?? []) as PricingProduct[],
  };
}

export async function getAdminProductDetail(productId: string) {
  const { supabase, profile } = await requireAdminContext();
  await ensureDefaultPricingSetup(profile.organization_id);
  const [productResult, rateSheetsResult] = await Promise.all([
    supabase
      .from("loan_products")
      .select("id, organization_id, name, loan_type, term_months, amortization_type, arm_initial_period, guidelines, description, is_active, display_order")
      .eq("id", productId)
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("rate_sheets")
      .select("id, loan_product_id, effective_date, expiry_date, rate_data, margin, is_active")
      .eq("loan_product_id", productId)
      .eq("organization_id", profile.organization_id)
      .is("deleted_at", null)
      .order("effective_date", { ascending: false }),
  ]);

  if (productResult.error) {
    throw new Error(productResult.error.message);
  }

  if (!productResult.data) {
    notFound();
  }

  if (rateSheetsResult.error) {
    throw new Error(rateSheetsResult.error.message);
  }

  return {
    profile,
    product: productResult.data as PricingProduct,
    rateSheets: (rateSheetsResult.data ?? []) as PricingRateSheet[],
  };
}
