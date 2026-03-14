import type { Json } from "@/types/database";

export interface BorrowerDashboardLoan {
  id: string;
  loan_number: string | null;
  status: string;
  loan_amount: number | null;
  loan_purpose: string;
  loan_type: string;
  created_at: string;
  updated_at: string;
  estimated_closing: string | null;
  stage_name: string | null;
  stage_color: string | null;
}

export interface LoanProperty {
  id: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    county?: string;
  };
  property_type: string;
  occupancy_type: string;
  purchase_price: number | null;
}

export interface BorrowerProfileSnapshot {
  id: string;
  loan_application_id: string;
  dob: string | null;
  marital_status: string | null;
  citizenship: string | null;
  dependents_count: number | null;
  address_current: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    county?: string;
  } | null;
  years_at_address: number | null;
  housing_status: string | null;
  monthly_housing_payment: number | null;
}

export interface EmploymentRecordSnapshot {
  id: string;
  employer_name: string;
  employer_phone: string | null;
  position: string | null;
  employment_type: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  is_primary: boolean;
  employer_address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  base_monthly_income: number | null;
  overtime_monthly: number | null;
  bonus_monthly: number | null;
  commission_monthly: number | null;
  other_monthly: number | null;
}

export interface AssetSnapshot {
  id: string;
  asset_type: string;
  institution_name: string | null;
  account_last4: string | null;
  balance: number;
  is_gift: boolean;
  gift_source: string | null;
}

export interface LiabilitySnapshot {
  id: string;
  liability_type: string;
  creditor_name: string | null;
  account_number_last4: string | null;
  monthly_payment: number;
  outstanding_balance: number | null;
  months_remaining: number | null;
  to_be_paid_off: boolean;
  exclude_from_dti: boolean;
  exclude_reason: string | null;
}

export interface BorrowerDraftApplication {
  id: string;
  loan_number: string | null;
  status: string;
  loan_amount: number | null;
  loan_purpose: string;
  loan_type: string;
  down_payment: number | null;
  term_months: number | null;
  created_at: string;
  updated_at: string;
  property: LoanProperty | null;
  borrowerProfile: BorrowerProfileSnapshot | null;
  employmentRecords: EmploymentRecordSnapshot[];
  assets: AssetSnapshot[];
  liabilities: LiabilitySnapshot[];
}

export interface LoanStatusDocument {
  id: string;
  document_type: string;
  status: string;
  created_at: string;
  file_name: string;
}

export interface LoanCondition {
  id: string;
  description: string;
  status: string;
  condition_type: string;
  due_date: string | null;
}

export interface LoanTask {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  task_type: string | null;
}

export interface LoanMessagePreview {
  id: string;
  body: string;
  created_at: string;
  sender_name: string;
}

export interface PrequalificationAnalysis {
  id: string;
  created_at: string;
  status: string;
  result: Json;
}

export interface BorrowerLoanDetails {
  id: string;
  organization_id: string;
  loan_number: string | null;
  status: string;
  loan_amount: number | null;
  loan_purpose: string;
  loan_type: string;
  created_at: string;
  submitted_at: string | null;
  estimated_closing: string | null;
  stage: {
    id: string;
    name: string;
    color: string;
    order_index: number;
  } | null;
  stageTimeline: Array<{
    id: string;
    name: string;
    color: string;
    order_index: number;
    isCurrent: boolean;
    isComplete: boolean;
  }>;
  property: LoanProperty | null;
  documents: LoanStatusDocument[];
  conditions: LoanCondition[];
  tasks: LoanTask[];
  lastMessages: LoanMessagePreview[];
  prequalification: PrequalificationAnalysis | null;
}

export interface BorrowerDocumentListItem extends LoanStatusDocument {
  signed_url: string | null;
}

export interface BorrowerMessage {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  channel: string;
}
