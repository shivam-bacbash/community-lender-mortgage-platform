export const LTV_BUCKETS = [80, 85, 90, 95, 97] as const;
export const FICO_BUCKETS = [620, 680, 720, 740, 760] as const;

export const DEFAULT_PRODUCTS = [
  {
    key: "conv30fixed",
    name: "30 Year Fixed Conventional",
    loan_type: "conventional",
    term_months: 360,
    amortization_type: "fixed",
    guidelines: {
      min_credit_score: 620,
      max_dti: 0.45,
      max_ltv: 0.97,
      min_loan_amount: 75000,
      max_loan_amount: 766550,
    },
    description: "Standard conforming fixed-rate product for primary residences.",
    display_order: 10,
    base_rate: 6.625,
    margin: 0.125,
  },
  {
    key: "fha30fixed",
    name: "30 Year Fixed FHA",
    loan_type: "fha",
    term_months: 360,
    amortization_type: "fixed",
    guidelines: {
      min_credit_score: 580,
      max_dti: 0.57,
      max_ltv: 0.965,
      min_loan_amount: 50000,
      max_loan_amount: 766550,
    },
    description: "Government-insured fixed-rate product with flexible credit overlays.",
    display_order: 20,
    base_rate: 6.5,
    margin: 0.15,
  },
  {
    key: "va30fixed",
    name: "30 Year Fixed VA",
    loan_type: "va",
    term_months: 360,
    amortization_type: "fixed",
    guidelines: {
      min_credit_score: 620,
      max_dti: 0.5,
      min_loan_amount: 50000,
      max_loan_amount: 1200000,
    },
    description: "Veteran-focused fixed-rate product with competitive pricing.",
    display_order: 30,
    base_rate: 6.375,
    margin: 0.12,
  },
  {
    key: "usda30fixed",
    name: "30 Year Fixed USDA",
    loan_type: "usda",
    term_months: 360,
    amortization_type: "fixed",
    guidelines: {
      min_credit_score: 640,
      max_dti: 0.41,
      min_loan_amount: 50000,
      max_loan_amount: 650000,
    },
    description: "Rural housing fixed-rate product with conservative eligibility caps.",
    display_order: 40,
    base_rate: 6.75,
    margin: 0.17,
  },
  {
    key: "jumbo30fixed",
    name: "30 Year Fixed Jumbo",
    loan_type: "jumbo",
    term_months: 360,
    amortization_type: "fixed",
    guidelines: {
      min_credit_score: 700,
      max_dti: 0.43,
      max_ltv: 0.8,
      min_loan_amount: 766551,
      max_loan_amount: 2500000,
    },
    description: "Portfolio jumbo product for higher-balance fixed-rate loans.",
    display_order: 50,
    base_rate: 7,
    margin: 0.2,
  },
] as const;

export const DEFAULT_FEE_TEMPLATES: Record<
  string,
  Array<{
    fee_type:
      | "origination"
      | "appraisal"
      | "credit_report"
      | "flood_cert"
      | "title_search"
      | "title_insurance";
    fee_name: string;
    amount: number;
    disclosure_section: "A" | "B" | "C";
    tolerance_bucket: "zero" | "ten_percent" | "unlimited";
  }>
> = {
  conventional: [
    { fee_type: "origination", fee_name: "Origination Fee", amount: 1500, disclosure_section: "A", tolerance_bucket: "zero" },
    { fee_type: "appraisal", fee_name: "Appraisal Fee", amount: 550, disclosure_section: "B", tolerance_bucket: "ten_percent" },
    { fee_type: "credit_report", fee_name: "Credit Report", amount: 75, disclosure_section: "B", tolerance_bucket: "zero" },
    { fee_type: "flood_cert", fee_name: "Flood Determination", amount: 20, disclosure_section: "B", tolerance_bucket: "zero" },
    { fee_type: "title_search", fee_name: "Title Search", amount: 200, disclosure_section: "C", tolerance_bucket: "ten_percent" },
    { fee_type: "title_insurance", fee_name: "Lender Title Insurance", amount: 850, disclosure_section: "B", tolerance_bucket: "ten_percent" },
  ],
  fha: [
    { fee_type: "origination", fee_name: "Origination Fee", amount: 1450, disclosure_section: "A", tolerance_bucket: "zero" },
    { fee_type: "appraisal", fee_name: "Appraisal Fee", amount: 575, disclosure_section: "B", tolerance_bucket: "ten_percent" },
    { fee_type: "credit_report", fee_name: "Credit Report", amount: 75, disclosure_section: "B", tolerance_bucket: "zero" },
    { fee_type: "flood_cert", fee_name: "Flood Determination", amount: 20, disclosure_section: "B", tolerance_bucket: "zero" },
    { fee_type: "title_search", fee_name: "Title Search", amount: 225, disclosure_section: "C", tolerance_bucket: "ten_percent" },
    { fee_type: "title_insurance", fee_name: "Lender Title Insurance", amount: 875, disclosure_section: "B", tolerance_bucket: "ten_percent" },
  ],
  va: [
    { fee_type: "origination", fee_name: "Origination Fee", amount: 1250, disclosure_section: "A", tolerance_bucket: "zero" },
    { fee_type: "appraisal", fee_name: "Appraisal Fee", amount: 650, disclosure_section: "B", tolerance_bucket: "ten_percent" },
    { fee_type: "credit_report", fee_name: "Credit Report", amount: 75, disclosure_section: "B", tolerance_bucket: "zero" },
    { fee_type: "flood_cert", fee_name: "Flood Determination", amount: 20, disclosure_section: "B", tolerance_bucket: "zero" },
    { fee_type: "title_search", fee_name: "Title Search", amount: 225, disclosure_section: "C", tolerance_bucket: "ten_percent" },
    { fee_type: "title_insurance", fee_name: "Lender Title Insurance", amount: 875, disclosure_section: "B", tolerance_bucket: "ten_percent" },
  ],
  usda: [
    { fee_type: "origination", fee_name: "Origination Fee", amount: 1350, disclosure_section: "A", tolerance_bucket: "zero" },
    { fee_type: "appraisal", fee_name: "Appraisal Fee", amount: 550, disclosure_section: "B", tolerance_bucket: "ten_percent" },
    { fee_type: "credit_report", fee_name: "Credit Report", amount: 75, disclosure_section: "B", tolerance_bucket: "zero" },
    { fee_type: "flood_cert", fee_name: "Flood Determination", amount: 20, disclosure_section: "B", tolerance_bucket: "zero" },
    { fee_type: "title_search", fee_name: "Title Search", amount: 200, disclosure_section: "C", tolerance_bucket: "ten_percent" },
    { fee_type: "title_insurance", fee_name: "Lender Title Insurance", amount: 850, disclosure_section: "B", tolerance_bucket: "ten_percent" },
  ],
  jumbo: [
    { fee_type: "origination", fee_name: "Origination Fee", amount: 2200, disclosure_section: "A", tolerance_bucket: "zero" },
    { fee_type: "appraisal", fee_name: "Appraisal Fee", amount: 800, disclosure_section: "B", tolerance_bucket: "ten_percent" },
    { fee_type: "credit_report", fee_name: "Credit Report", amount: 95, disclosure_section: "B", tolerance_bucket: "zero" },
    { fee_type: "flood_cert", fee_name: "Flood Determination", amount: 35, disclosure_section: "B", tolerance_bucket: "zero" },
    { fee_type: "title_search", fee_name: "Title Search", amount: 325, disclosure_section: "C", tolerance_bucket: "ten_percent" },
    { fee_type: "title_insurance", fee_name: "Lender Title Insurance", amount: 1250, disclosure_section: "B", tolerance_bucket: "ten_percent" },
  ],
};

export function buildDefaultRateMatrix(baseRate: number) {
  const matrix: Record<string, { rate: number; points: number }> = {};

  for (const ltv of LTV_BUCKETS) {
    for (const fico of FICO_BUCKETS) {
      const ltvAdjustment = Math.max(0, (ltv - 80) / 5) * 0.125;
      const ficoAdjustment = Math.max(0, (760 - fico) / 20) * 0.0625;
      const rate = Math.round((baseRate + ltvAdjustment + ficoAdjustment) * 1000) / 1000;
      const points = Math.max(0, Math.round(((ltvAdjustment + ficoAdjustment) * 2) * 1000) / 1000);
      matrix[`ltv_${ltv}_fico_${fico}`] = { rate, points };
    }
  }

  return matrix;
}
