create index if not exists idx_ai_analyses_risk_assessment
  on ai_analyses(loan_application_id, created_at desc)
  where analysis_type = 'risk_assessment';

insert into underwriting_rules (
  organization_id,
  loan_type,
  rule_name,
  rule_config,
  is_active,
  priority,
  description
)
select
  organizations.id,
  seeded.loan_type,
  seeded.rule_name,
  seeded.rule_config,
  true,
  seeded.priority,
  seeded.description
from organizations
cross join (
  values
    ('conventional', 'min_credit_score', '{"min": 620}'::jsonb, 10, 'Minimum representative credit score for conventional loans.'),
    ('conventional', 'max_dti', '{"max": 0.45}'::jsonb, 20, 'Maximum debt-to-income ratio for conventional loans.'),
    ('conventional', 'max_ltv', '{"max": 0.97}'::jsonb, 30, 'Maximum loan-to-value ratio for conventional loans.'),
    ('conventional', 'min_months_reserves', '{"min": 2}'::jsonb, 40, 'Minimum post-closing reserves for conventional loans.'),
    ('fha', 'min_credit_score', '{"min": 580}'::jsonb, 10, 'Minimum representative credit score for FHA loans.'),
    ('fha', 'max_dti', '{"max": 0.57}'::jsonb, 20, 'Maximum debt-to-income ratio for FHA loans.'),
    ('fha', 'max_ltv', '{"max": 0.965}'::jsonb, 30, 'Maximum loan-to-value ratio for FHA loans.'),
    ('va', 'min_credit_score', '{"min": 620}'::jsonb, 10, 'Minimum representative credit score for VA loans.'),
    ('va', 'max_dti', '{"max": 0.50}'::jsonb, 20, 'Maximum debt-to-income ratio for VA loans.'),
    ('va', 'min_months_reserves', '{"min": 2}'::jsonb, 30, 'Minimum reserves guideline for VA loans.'),
    ('usda', 'min_credit_score', '{"min": 640}'::jsonb, 10, 'Minimum representative credit score for USDA loans.'),
    ('usda', 'max_dti', '{"max": 0.41}'::jsonb, 20, 'Maximum debt-to-income ratio for USDA loans.'),
    ('jumbo', 'min_credit_score', '{"min": 700}'::jsonb, 10, 'Minimum representative credit score for jumbo loans.'),
    ('jumbo', 'max_dti', '{"max": 0.43}'::jsonb, 20, 'Maximum debt-to-income ratio for jumbo loans.'),
    ('jumbo', 'max_ltv', '{"max": 0.80}'::jsonb, 30, 'Maximum loan-to-value ratio for jumbo loans.'),
    ('jumbo', 'min_months_reserves', '{"min": 6}'::jsonb, 40, 'Minimum reserves guideline for jumbo loans.'),
    ('all', 'max_loan_amount', '{"max": 1500000}'::jsonb, 999, 'Absolute maximum loan amount for the lending platform.')
) as seeded(loan_type, rule_name, rule_config, priority, description)
on conflict (organization_id, loan_type, rule_name) do nothing;
