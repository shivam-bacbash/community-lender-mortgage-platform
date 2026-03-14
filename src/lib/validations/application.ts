import { z } from "zod";
import { pgUuidSchema } from "@/lib/validations/shared";

const positiveCurrency = z.number().min(0);

const addressSchema = z.object({
  street: z.string().min(1, "Street is required."),
  city: z.string().min(1, "City is required."),
  state: z.string().length(2, "Use a 2-letter state code."),
  zip: z.string().regex(/^\d{5}$/, "Use a 5-digit ZIP code."),
});

export const step1Schema = z.object({
  loan_purpose: z.enum(["purchase", "refinance", "cash_out"]),
  loan_type: z.enum(["conventional", "fha", "va", "usda", "jumbo"]),
  loan_amount: z.number().min(50000).max(5000000),
  down_payment: positiveCurrency,
  property_street: addressSchema.shape.street,
  property_city: addressSchema.shape.city,
  property_state: addressSchema.shape.state,
  property_zip: addressSchema.shape.zip,
  property_type: z.enum(["sfr", "condo", "townhouse", "2_unit", "3_unit", "4_unit"]),
  occupancy_type: z.enum(["primary", "secondary", "investment"]),
  purchase_price: positiveCurrency.optional(),
});

export const step2Schema = z.object({
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "Use SSN format 000-00-0000."),
  dob: z.string().min(1, "Date of birth is required."),
  marital_status: z.enum(["single", "married", "separated"]),
  citizenship: z.enum(["us_citizen", "permanent_resident", "non_permanent_resident"]),
  dependents_count: z.number().int().min(0).max(20),
});

export const step3Schema = z.object({
  current_street: addressSchema.shape.street,
  current_city: addressSchema.shape.city,
  current_state: addressSchema.shape.state,
  current_zip: addressSchema.shape.zip,
  current_county: z.string().optional(),
  housing_status: z.enum(["own", "rent", "living_with_family"]),
  years_at_address: z.number().min(0).max(99),
  monthly_housing_payment: positiveCurrency,
});

const employerSchema = z.object({
  employer_name: z.string().min(1, "Employer name is required."),
  employer_phone: z.string().optional(),
  position: z.string().optional(),
  employment_type: z.enum(["w2", "self_employed", "1099", "retired", "other"]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_current: z.boolean(),
  is_primary: z.boolean(),
  employer_street: z.string().optional(),
  employer_city: z.string().optional(),
  employer_state: z.string().max(2).optional(),
  employer_zip: z.string().optional(),
  base_monthly_income: positiveCurrency,
  overtime_monthly: positiveCurrency,
  bonus_monthly: positiveCurrency,
  commission_monthly: positiveCurrency,
  other_monthly: positiveCurrency,
});

export const step4Schema = z.object({
  employers: z.array(employerSchema).min(1, "Add at least one employer."),
});

const assetSchema = z.object({
  asset_type: z.enum([
    "checking",
    "savings",
    "money_market",
    "cd",
    "401k",
    "ira",
    "stocks",
    "bonds",
    "real_estate",
    "gift",
    "other",
  ]),
  institution_name: z.string().optional(),
  account_last4: z.string().max(4).optional(),
  balance: positiveCurrency,
  is_gift: z.boolean(),
  gift_source: z.string().optional(),
});

export const step5Schema = z.object({
  assets: z.array(assetSchema).min(1, "Add at least one asset."),
});

const liabilitySchema = z.object({
  liability_type: z.enum([
    "mortgage",
    "auto",
    "student",
    "credit_card",
    "personal_loan",
    "child_support",
    "alimony",
    "other",
  ]),
  creditor_name: z.string().optional(),
  account_number_last4: z.string().max(4).optional(),
  monthly_payment: positiveCurrency,
  outstanding_balance: positiveCurrency.optional(),
  months_remaining: z.number().int().min(0).optional(),
  to_be_paid_off: z.boolean(),
  exclude_from_dti: z.boolean(),
  exclude_reason: z.string().optional(),
});

export const step6Schema = z.object({
  liabilities: z.array(liabilitySchema),
});

export const documentUploadSchema = z.object({
  loanId: pgUuidSchema,
  documentType: z.enum([
    "paystub",
    "w2",
    "tax_return",
    "bank_statement",
    "photo_id",
    "social_security",
    "gift_letter",
    "purchase_contract",
    "title_commitment",
    "appraisal_report",
    "flood_cert",
    "homeowners_insurance",
    "loan_estimate",
    "closing_disclosure",
    "deed_of_trust",
    "promissory_note",
    "voe",
    "voa",
    "credit_auth",
    "other",
  ]),
});

export const messageSchema = z.object({
  loanId: pgUuidSchema,
  body: z.string().min(1).max(4000),
  attachmentIds: z.array(pgUuidSchema).max(5).optional(),
});

export const fullApplicationSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema)
  .merge(step6Schema);

export type Step1Input = z.infer<typeof step1Schema>;
export type Step2Input = z.infer<typeof step2Schema>;
export type Step3Input = z.infer<typeof step3Schema>;
export type Step4Input = z.infer<typeof step4Schema>;
export type Step5Input = z.infer<typeof step5Schema>;
export type Step6Input = z.infer<typeof step6Schema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
