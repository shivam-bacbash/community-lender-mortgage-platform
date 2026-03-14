-- ============================================================
-- underwriting/001_underwriting.sql
-- UW decisions, credit reports, configurable rules engine.
-- ============================================================

-- ------------------------------------------------------------
-- underwriting_rules
-- Org-level configurable thresholds per loan type.
-- ------------------------------------------------------------
create table underwriting_rules (
  id                    uuid primary key default uuid_generate_v4(),
  organization_id       uuid not null references organizations(id) on delete cascade,

  loan_type             text not null,             -- conventional / fha / va / all
  rule_name             text not null,             -- e.g. "max_dti", "min_credit_score"
  rule_config           jsonb not null,
  -- Example:
  -- { "min": 620 }                  → credit score floor
  -- { "max": 0.43 }                 → DTI ceiling
  -- { "max": 0.97 }                 → LTV ceiling

  is_active             boolean not null default true,
  priority              integer not null default 0, -- lower = evaluated first
  description           text,

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz,

  unique(organization_id, loan_type, rule_name)
);

create index idx_uw_rules_org on underwriting_rules(organization_id, is_active);

select attach_audit_triggers('underwriting_rules');

alter table underwriting_rules enable row level security;

create policy "uw_rules_read" on underwriting_rules
  for select using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

create policy "uw_rules_manage" on underwriting_rules
  for all using (
    organization_id in (
      select organization_id from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- credit_reports
-- One row per bureau pull per borrower per application.
-- ------------------------------------------------------------
create table credit_reports (
  id                    uuid primary key default uuid_generate_v4(),
  borrower_profile_id   uuid not null references borrower_profiles(id) on delete cascade,
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,
  requested_by          uuid references profiles(id),

  bureau                text not null check (bureau in ('experian', 'equifax', 'transunion', 'tri_merge')),
  score                 integer,
  score_model           text,                      -- e.g. "FICO 8", "VantageScore 3.0"

  -- Full report stored as encrypted JSON
  report_data           jsonb default '{}'::jsonb, -- tradelines, inquiries, derog items
  reference_number      text,                      -- bureau's reference ID
  pulled_at             timestamptz not null default now(),

  -- Expiry (credit reports valid 120 days)
  expires_at            timestamptz generated always as
                        (pulled_at + interval '120 days') stored,

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_credit_reports_borrower on credit_reports(borrower_profile_id);
create index idx_credit_reports_loan     on credit_reports(loan_application_id);

select attach_audit_triggers('credit_reports');

alter table credit_reports enable row level security;

create policy "credit_reports_staff" on credit_reports
  for all using (
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );

-- ------------------------------------------------------------
-- underwriting_decisions
-- One decision per UW pass. Multiple passes allowed (conditions
-- may require re-submission).
-- ------------------------------------------------------------
create table underwriting_decisions (
  id                    uuid primary key default uuid_generate_v4(),
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,
  underwriter_id        uuid references profiles(id),

  decision              text not null
                        check (decision in ('approved', 'approved_with_conditions', 'suspended', 'denied')),
  decision_pass         integer not null default 1, -- increment on re-submissions

  -- Key ratios at time of decision
  approved_amount       numeric(15,2),
  dti_ratio             numeric(5,4),               -- e.g. 0.4300 = 43%
  ltv_ratio             numeric(5,4),
  cltv_ratio            numeric(5,4),               -- combined LTV
  credit_score_used     integer,

  -- Denial reasons (ECOA/HMDA codes if denied)
  denial_reasons        jsonb default '[]'::jsonb,

  notes                 text,
  decided_at            timestamptz not null default now(),

  -- AI-generated summary stored alongside human decision
  ai_summary            jsonb default '{}'::jsonb,
  -- {
  --   "risk_score": 72,
  --   "strengths": [...],
  --   "concerns": [...],
  --   "recommendation": "approve"
  -- }

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_uw_decisions_loan on underwriting_decisions(loan_application_id);
create index idx_uw_decisions_uw   on underwriting_decisions(underwriter_id);

select attach_audit_triggers('underwriting_decisions');

alter publication supabase_realtime add table underwriting_decisions;

alter table underwriting_decisions enable row level security;

create policy "uw_decisions_staff" on underwriting_decisions
  for all using (
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );

-- Borrowers can see the decision (not the full ratios)
create policy "uw_decisions_borrower_select" on underwriting_decisions
  for select using (
    loan_application_id in (
      select id from loan_applications
      where borrower_id = auth.uid() or co_borrower_id = auth.uid()
    )
  );
