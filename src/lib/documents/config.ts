export const DOCUMENT_TYPE_OPTIONS = [
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
] as const;

export type DocumentType = (typeof DOCUMENT_TYPE_OPTIONS)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  paystub: "Paystub",
  w2: "W-2",
  tax_return: "Tax Return",
  bank_statement: "Bank Statement",
  photo_id: "Photo ID",
  social_security: "Social Security Card",
  gift_letter: "Gift Letter",
  purchase_contract: "Purchase Contract",
  title_commitment: "Title Commitment",
  appraisal_report: "Appraisal Report",
  flood_cert: "Flood Certification",
  homeowners_insurance: "Homeowners Insurance",
  loan_estimate: "Loan Estimate",
  closing_disclosure: "Closing Disclosure",
  deed_of_trust: "Deed of Trust",
  promissory_note: "Promissory Note",
  voe: "Verification of Employment",
  voa: "Verification of Assets",
  credit_auth: "Credit Authorization",
  other: "Other",
};

export const DOCUMENT_CATEGORY_BY_TYPE: Record<DocumentType, "borrower" | "property" | "closing" | "compliance" | "internal"> = {
  paystub: "borrower",
  w2: "borrower",
  tax_return: "borrower",
  bank_statement: "borrower",
  photo_id: "borrower",
  social_security: "borrower",
  gift_letter: "borrower",
  purchase_contract: "property",
  title_commitment: "property",
  appraisal_report: "property",
  flood_cert: "property",
  homeowners_insurance: "property",
  loan_estimate: "closing",
  closing_disclosure: "closing",
  deed_of_trust: "closing",
  promissory_note: "closing",
  voe: "compliance",
  voa: "compliance",
  credit_auth: "compliance",
  other: "internal",
};

export const DOCUMENT_EXPIRY_DAYS: Partial<Record<DocumentType, number>> = {
  paystub: 60,
  bank_statement: 60,
  credit_auth: 120,
  photo_id: 365,
};

export const REQUIRED_DOCS: Record<string, DocumentType[]> = {
  conventional: ["paystub", "w2", "bank_statement", "photo_id", "purchase_contract"],
  fha: ["paystub", "w2", "bank_statement", "photo_id", "purchase_contract", "social_security"],
  va: ["paystub", "w2", "bank_statement", "photo_id", "purchase_contract"],
  usda: ["paystub", "w2", "bank_statement", "photo_id", "purchase_contract"],
  jumbo: ["paystub", "w2", "tax_return", "bank_statement", "photo_id", "purchase_contract"],
};

export function getDocumentTypeLabel(documentType: string) {
  return DOCUMENT_TYPE_LABELS[documentType as DocumentType] ?? documentType.replaceAll("_", " ");
}

export function getDocumentCategory(documentType: DocumentType) {
  return DOCUMENT_CATEGORY_BY_TYPE[documentType];
}

export function getDocumentExpiryDays(documentType: DocumentType) {
  return DOCUMENT_EXPIRY_DAYS[documentType] ?? null;
}

export function getRequiredDocumentsForLoanType(loanType: string) {
  return REQUIRED_DOCS[loanType] ?? REQUIRED_DOCS.conventional;
}
