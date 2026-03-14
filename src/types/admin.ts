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
