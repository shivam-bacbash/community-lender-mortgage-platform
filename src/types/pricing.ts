import type { Json } from "@/types/database";

export interface PricingProduct {
  id: string;
  organization_id: string;
  name: string;
  loan_type: string;
  term_months: number;
  amortization_type: string;
  arm_initial_period: number | null;
  guidelines: Json;
  description: string | null;
  is_active: boolean;
  display_order: number | null;
}

export interface PricingRateSheet {
  id: string;
  loan_product_id: string;
  effective_date: string;
  expiry_date: string | null;
  rate_data: Json;
  margin: number | null;
  is_active: boolean;
}

export interface ProductRateQuote {
  product_id: string;
  product_name: string;
  loan_type: string;
  term_months: number;
  rate_sheet_id: string;
  rate: number;
  apr: number;
  monthlyPayment: number;
  points: number;
}

export interface PricingResult {
  rate: number;
  apr: number;
  monthlyPayment: number;
  points: number;
  availableProducts: ProductRateQuote[];
}

export interface PricingFeeItem {
  id: string;
  fee_type: string;
  fee_name: string;
  amount: number;
  paid_by: string;
  disclosure_section: string | null;
  tolerance_bucket: string | null;
}

export interface RateLockSummary {
  id: string;
  loan_product_id: string | null;
  rate: number;
  apr: number | null;
  points: number | null;
  lock_period_days: number;
  locked_at: string;
  expires_at: string;
  status: string;
}

export interface StaffPricingWorkspace {
  loan: {
    id: string;
    organization_id: string;
    loan_number: string | null;
    loan_type: string;
    loan_amount: number;
    down_payment: number;
    term_months: number;
    status: string;
  };
  profile: {
    credit_score: number | null;
    ltv: number | null;
    occupancy_type: string | null;
    property_type: string | null;
    borrower_name: string;
  };
  pricingResult: PricingResult | null;
  fees: PricingFeeItem[];
  feeTotals: {
    bySection: Array<{ section: string; total: number }>;
    closingCosts: number;
    cashToClose: number;
  };
  activeRateLock: RateLockSummary | null;
}
