export const UNDERWRITING_LOAN_TYPES = [
  "conventional",
  "fha",
  "va",
  "usda",
  "jumbo",
  "all",
] as const;

export type UnderwritingLoanType = (typeof UNDERWRITING_LOAN_TYPES)[number];

export const HARD_STOP_RULE_NAMES = [
  "min_credit_score",
  "max_ltv",
  "max_loan_amount",
] as const;

export const DEFAULT_UNDERWRITING_RULES = [
  {
    loan_type: "conventional",
    rule_name: "min_credit_score",
    rule_config: { min: 620 },
    priority: 10,
    description: "Minimum representative credit score for conventional loans.",
  },
  {
    loan_type: "conventional",
    rule_name: "max_dti",
    rule_config: { max: 0.45 },
    priority: 20,
    description: "Maximum debt-to-income ratio for conventional loans.",
  },
  {
    loan_type: "conventional",
    rule_name: "max_ltv",
    rule_config: { max: 0.97 },
    priority: 30,
    description: "Maximum loan-to-value ratio for conventional loans.",
  },
  {
    loan_type: "conventional",
    rule_name: "min_months_reserves",
    rule_config: { min: 2 },
    priority: 40,
    description: "Minimum post-closing reserves for conventional loans.",
  },
  {
    loan_type: "fha",
    rule_name: "min_credit_score",
    rule_config: { min: 580 },
    priority: 10,
    description: "Minimum representative credit score for FHA loans.",
  },
  {
    loan_type: "fha",
    rule_name: "max_dti",
    rule_config: { max: 0.57 },
    priority: 20,
    description: "Maximum debt-to-income ratio for FHA loans.",
  },
  {
    loan_type: "fha",
    rule_name: "max_ltv",
    rule_config: { max: 0.965 },
    priority: 30,
    description: "Maximum loan-to-value ratio for FHA loans.",
  },
  {
    loan_type: "va",
    rule_name: "min_credit_score",
    rule_config: { min: 620 },
    priority: 10,
    description: "Minimum representative credit score for VA loans.",
  },
  {
    loan_type: "va",
    rule_name: "max_dti",
    rule_config: { max: 0.50 },
    priority: 20,
    description: "Maximum debt-to-income ratio for VA loans.",
  },
  {
    loan_type: "va",
    rule_name: "min_months_reserves",
    rule_config: { min: 2 },
    priority: 30,
    description: "Minimum reserves guideline for VA loans.",
  },
  {
    loan_type: "usda",
    rule_name: "min_credit_score",
    rule_config: { min: 640 },
    priority: 10,
    description: "Minimum representative credit score for USDA loans.",
  },
  {
    loan_type: "usda",
    rule_name: "max_dti",
    rule_config: { max: 0.41 },
    priority: 20,
    description: "Maximum debt-to-income ratio for USDA loans.",
  },
  {
    loan_type: "jumbo",
    rule_name: "min_credit_score",
    rule_config: { min: 700 },
    priority: 10,
    description: "Minimum representative credit score for jumbo loans.",
  },
  {
    loan_type: "jumbo",
    rule_name: "max_dti",
    rule_config: { max: 0.43 },
    priority: 20,
    description: "Maximum debt-to-income ratio for jumbo loans.",
  },
  {
    loan_type: "jumbo",
    rule_name: "max_ltv",
    rule_config: { max: 0.80 },
    priority: 30,
    description: "Maximum loan-to-value ratio for jumbo loans.",
  },
  {
    loan_type: "jumbo",
    rule_name: "min_months_reserves",
    rule_config: { min: 6 },
    priority: 40,
    description: "Minimum reserves guideline for jumbo loans.",
  },
  {
    loan_type: "all",
    rule_name: "max_loan_amount",
    rule_config: { max: 1500000 },
    priority: 999,
    description: "Absolute maximum loan amount for the lending platform.",
  },
] as const;
