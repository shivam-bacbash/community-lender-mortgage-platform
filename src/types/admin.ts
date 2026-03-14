export interface UnderwritingRuleRecord {
  id: string;
  organization_id: string;
  loan_type: string;
  rule_name: string;
  rule_config: {
    min?: number;
    max?: number;
    values?: string[];
  };
  is_active: boolean;
  priority: number;
  description: string | null;
}

export interface AdminDashboardMetric {
  label: string;
  value: number;
  helper: string;
}

export interface AdminUserRecord {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  role: string;
  email: string | null;
  branch_name: string | null;
  branch_id: string | null;
  is_active: boolean;
  created_at: string;
  last_active_at: string | null;
  invitation_sent_at: string | null;
}

export interface AdminBranchRecord {
  id: string;
  organization_id: string;
  name: string;
  nmls_id: string | null;
  phone: string | null;
  is_active: boolean;
  manager_id: string | null;
  manager_name: string | null;
  member_count: number;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
}

export interface AdminPipelineStageRecord {
  id: string;
  organization_id: string;
  name: string;
  color: string;
  description: string | null;
  order_index: number;
  sla_days: number | null;
  is_terminal: boolean;
  terminal_outcome: "funded" | "denied" | "withdrawn" | "cancelled" | null;
  active_loan_count: number;
}

export interface AdminOrganizationSettings {
  organizationId: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  brand_colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
  } | null;
  settings: {
    nmls_id?: string;
    default_assignment_mode?: "round_robin" | "manual";
    feature_flags?: {
      ai_prequalification?: boolean;
      sms_notifications?: boolean;
      secondary_market?: boolean;
    };
  } | null;
}
