import type { Json } from "@/types/database";
import type { Role } from "@/types/auth";
import type {
  DocumentExtractionResult,
  RiskAssessmentResult,
  UnderwritingSummaryResult,
} from "@/lib/ai/results";

export interface StaffProfileSummary {
  id: string;
  organization_id: string;
  role: Role;
  first_name: string;
  last_name: string;
}

export interface StaffMetricCard {
  label: string;
  value: number;
  helper: string;
}

export interface StaffActivityItem {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
  actor_name: string;
}

export interface StaffTaskPreview {
  id: string;
  loan_application_id: string;
  title: string;
  status: string;
  due_date: string | null;
  priority: string;
  loan_number: string | null;
}

export interface PipelineStageSummary {
  id: string;
  name: string;
  color: string;
  order_index: number;
  sla_days: number | null;
  is_terminal: boolean;
}

export interface PipelineLoan {
  id: string;
  organization_id: string;
  loan_number: string | null;
  status: string;
  loan_amount: number | null;
  loan_purpose: string;
  loan_type: string;
  submitted_at: string | null;
  estimated_closing: string | null;
  updated_at: string;
  pipeline_stage_id: string | null;
  borrower_name: string;
  loan_officer_name: string | null;
  ai_risk_score: number | null;
  ai_recommendation: string | null;
  days_in_stage: number;
}

export interface StaffPipelineData {
  organizationId: string;
  profileId: string;
  stages: PipelineStageSummary[];
  loans: PipelineLoan[];
  staffOptions: Array<{ id: string; label: string }>;
}

export interface StaffLoanHeader {
  id: string;
  organization_id: string;
  loan_number: string | null;
  status: string;
  loan_amount: number | null;
  loan_type: string;
  loan_purpose: string;
  borrower_name: string;
}

export interface StaffBorrowerProfile {
  id: string;
  loan_application_id: string;
  dob: string | null;
  marital_status: string | null;
  citizenship: string | null;
  dependents_count: number | null;
  housing_status: string | null;
  monthly_housing_payment: number | null;
  years_at_address: number | null;
  declarations: Json | null;
  address_current: Json | null;
}

export interface StaffEmploymentRecord {
  id: string;
  employer_name: string;
  position: string | null;
  employment_type: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  is_primary: boolean;
  base_monthly_income: number | null;
  overtime_monthly: number | null;
  bonus_monthly: number | null;
  commission_monthly: number | null;
  other_monthly: number | null;
}

export interface StaffAsset {
  id: string;
  asset_type: string;
  institution_name: string | null;
  balance: number;
  is_gift: boolean;
  gift_source: string | null;
}

export interface StaffLiability {
  id: string;
  liability_type: string;
  creditor_name: string | null;
  monthly_payment: number;
  outstanding_balance: number | null;
  months_remaining: number | null;
  to_be_paid_off: boolean;
  exclude_from_dti: boolean;
  exclude_reason: string | null;
}

export interface StaffLoanDocument {
  id: string;
  document_type: string;
  document_category: string | null;
  file_name: string;
  storage_path: string;
  created_at: string;
  status: string;
  version: number;
  is_latest: boolean;
  parent_document_id: string | null;
  expires_at: string | null;
  uploaded_by_name: string;
  rejection_reason: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  ai_extracted_data: DocumentExtractionResult | null;
}

export interface StaffDocumentRequest {
  id: string;
  document_type: string;
  message: string | null;
  due_date: string | null;
  status: string;
  created_at: string;
  fulfilled_at?: string | null;
}

export interface StaffDocumentChecklistItem {
  document_type: string;
  label: string;
  is_complete: boolean;
  latest_status: string | null;
}

export interface StaffDocumentExpiryItem {
  id: string;
  document_type: string;
  file_name: string;
  expires_at: string;
  status: "expiring_soon" | "expired";
}

export interface StaffLoanCondition {
  id: string;
  condition_type: string;
  description: string;
  status: string;
  source: string | null;
  due_date: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  document_name: string | null;
  waived_reason: string | null;
}

export interface StaffLoanTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  priority: string;
  task_type: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
}

export interface StaffLoanMessage {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  is_internal: boolean;
}

export interface StaffUnderwritingDecision {
  id: string;
  decision: string;
  decided_at: string;
  approved_amount: number | null;
  dti_ratio: number | null;
  ltv_ratio: number | null;
  cltv_ratio: number | null;
  credit_score_used: number | null;
  notes: string | null;
  denial_reasons: Json | null;
  ai_summary: Json | null;
  underwriter_name: string | null;
}

export interface StaffLoanWorkspace {
  header: StaffLoanHeader;
  stage: PipelineStageSummary | null;
  stages: PipelineStageSummary[];
  borrowerProfile: StaffBorrowerProfile | null;
  employmentRecords: StaffEmploymentRecord[];
  assets: StaffAsset[];
  liabilities: StaffLiability[];
  property: {
    id: string;
    address: Json;
    property_type: string;
    occupancy_type: string;
    purchase_price: number | null;
    estimated_value: number | null;
    appraised_value: number | null;
  } | null;
  documents: StaffLoanDocument[];
  documentRequests: StaffDocumentRequest[];
  documentChecklist: {
    completed: number;
    total: number;
    percent: number;
    items: StaffDocumentChecklistItem[];
  };
  expiringDocuments: StaffDocumentExpiryItem[];
  conditions: StaffLoanCondition[];
  tasks: StaffLoanTask[];
  messages: StaffLoanMessage[];
  underwritingDecisions: StaffUnderwritingDecision[];
  aiAnalyses: Array<{
    id: string;
    analysis_type: string;
    created_at: string;
    status: string;
    confidence_score: number | null;
    error_message: string | null;
    result: Json;
    parsed_underwriting: UnderwritingSummaryResult | null;
    parsed_risk_assessment: RiskAssessmentResult | null;
  }>;
  latestCreditReport: {
    id: string;
    score: number | null;
    pulled_at: string;
  } | null;
  ratios: {
    dti: number | null;
    ltv: number | null;
    creditScore: number | null;
  };
  counts: {
    conditions: number;
    tasks: number;
    documents: number;
  };
  stageHistory: Array<{
    id: string;
    action: string;
    created_at: string;
    actor_name: string;
    after_state: Json | null;
  }>;
  borrowerName: string;
  borrowerId: string;
  staffMembers: Array<{ id: string; label: string; role: string }>;
}

export interface StaffLoanDocumentDetail {
  document: StaffLoanDocument;
  signedUrl: string | null;
  versionHistory: StaffLoanDocument[];
  requestHistory: StaffDocumentRequest[];
  loan: {
    id: string;
    loan_number: string | null;
    borrower_name: string;
  };
}
