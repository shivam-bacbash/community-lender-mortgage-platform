import type { Json } from "@/types/database";

export interface TRIDMilestone {
  key: string;
  label: string;
  due_at: string | null;
  sent_at: string | null;
  acknowledged_at: string | null;
  tone: "success" | "warning" | "error" | "neutral";
  helper: string;
}

export interface DisclosureRecord {
  id: string;
  disclosure_type: string;
  version: number;
  status: string;
  sent_at: string | null;
  deadline: string | null;
  acknowledged_at: string | null;
  notes: string | null;
  document_id: string | null;
}

export interface QMCheckResult {
  name: string;
  passed: boolean;
  value: string | number | null;
}

export interface QMResult {
  isQM: boolean;
  isHPML: boolean;
  isHOEPA: boolean;
  apor: number | null;
  rateSpread: number | null;
  checks: QMCheckResult[];
}

export interface HMDARecordSummary {
  id: string;
  action_taken: number | null;
  action_taken_date: string | null;
  census_tract: string | null;
  county_code: string | null;
  msa_code: string | null;
  reporting_year: number;
  rate_spread: number | null;
  hoepa_status: number | null;
  denial_reasons: number[] | null;
}

export interface LoanComplianceWorkspace {
  loan: {
    id: string;
    loan_number: string | null;
    status: string;
    loan_amount: number | null;
    loan_type: string;
    loan_purpose: string;
    submitted_at: string | null;
    estimated_closing: string | null;
    borrower_name: string;
  };
  trid: {
    milestones: TRIDMilestone[];
    disclosures: DisclosureRecord[];
    intent_to_proceed_at: string | null;
  };
  qm: QMResult;
  hmda: HMDARecordSummary | null;
  complianceAnalysis: {
    id: string;
    status: string;
    created_at: string;
    result: Json;
  } | null;
  recentAudit: Array<{
    id: string;
    created_at: string;
    action: string;
    actor_name: string;
    resource_type: string;
    before_state: Json | null;
    after_state: Json | null;
  }>;
}

export interface AdminComplianceMetric {
  label: string;
  value: number;
  helper: string;
}

export interface AdminComplianceOverview {
  metrics: AdminComplianceMetric[];
  upcomingDisclosures: Array<{
    id: string;
    loan_application_id: string;
    loan_number: string | null;
    disclosure_type: string;
    deadline: string | null;
    status: string;
  }>;
  hmdaRecords: HMDARecordSummary[];
  flaggedLoans: Array<{
    loan_application_id: string;
    loan_number: string | null;
    borrower_name: string;
    qm_status: "qm" | "non_qm";
    compliance_status: string | null;
  }>;
}

export interface AuditLogRecord {
  id: string;
  created_at: string;
  actor_name: string;
  actor_role: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  before_state: Json | null;
  after_state: Json | null;
}

export interface AuditLogPage {
  rows: AuditLogRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  filters: {
    action?: string;
    actor?: string;
    resource?: string;
    from?: string;
    to?: string;
  };
}
