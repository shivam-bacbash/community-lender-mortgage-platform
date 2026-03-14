-- ============================================================
-- ai/001_ai.sql
-- AI analyses, fraud flags, analytics events.
-- All append-only — no hard deletes.
-- ============================================================

-- ------------------------------------------------------------
-- ai_analyses
-- Every Claude API call result stored for auditability.
-- Append-only: no updates, no deletes (fair lending compliance).
-- ------------------------------------------------------------
create table ai_analyses (
  id                    uuid primary key default uuid_generate_v4(),
  loan_application_id   uuid not null references loan_applications(id),
  triggered_by_profile  uuid references profiles(id),

  analysis_type         text not null
                        check (analysis_type in (
                          'prequalification', 'fraud_detection',
                          'document_extraction', 'underwriting_summary',
                          'compliance_check', 'risk_assessment'
                        )),

  model_used            text not null default 'claude-sonnet-4-6',
  triggered_by          text not null default 'auto'
                        check (triggered_by in ('auto', 'manual')),

  -- Exact snapshot of data sent to AI (critical for audit trail)
  input_snapshot        jsonb not null default '{}'::jsonb,

  -- Full AI response
  result                jsonb not null default '{}'::jsonb,
  -- Prequalification example:
  -- {
  --   "score": 78,
  --   "recommendation": "likely_approve",
  --   "strengths": ["Strong income", "Low DTI at 32%"],
  --   "concerns": ["Thin credit file", "Recent job change"],
  --   "flags": [],
  --   "rationale": "..."
  -- }

  confidence_score      numeric(5,4),              -- 0.0000 to 1.0000
  tokens_used           integer,
  latency_ms            integer,

  -- Status
  status                text not null default 'completed'
                        check (status in ('pending', 'completed', 'failed', 'overridden')),
  error_message         text,                      -- if status = failed

  -- Human override
  overridden_by         uuid references profiles(id),
  override_reason       text,
  overridden_at         timestamptz,

  -- Append-only timestamps
  created_at            timestamptz not null default now()
  -- NOTE: No updated_at, no deleted_at — this table is immutable
);

create index idx_ai_analyses_loan on ai_analyses(loan_application_id, analysis_type);
create index idx_ai_analyses_type on ai_analyses(analysis_type, created_at desc);

-- No audit triggers — this table is append-only, no updates
alter table ai_analyses enable row level security;

-- Block all mutations except insert
create policy "ai_analyses_no_update" on ai_analyses
  as restrictive for update using (false);

create policy "ai_analyses_no_delete" on ai_analyses
  as restrictive for delete using (false);

create policy "ai_analyses_insert" on ai_analyses
  for insert with check (true);                   -- server-side service role only in practice

create policy "ai_analyses_staff_read" on ai_analyses
  for select using (
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );

-- ------------------------------------------------------------
-- fraud_flags
-- One row per detected anomaly. Soft-delete only.
-- ------------------------------------------------------------
create table fraud_flags (
  id                    uuid primary key default uuid_generate_v4(),
  loan_application_id   uuid not null references loan_applications(id),
  ai_analysis_id        uuid references ai_analyses(id),

  flag_type             text not null
                        check (flag_type in (
                          'doc_anomaly', 'income_mismatch',
                          'employment_inconsistency', 'address_mismatch',
                          'identity_concern', 'straw_buyer',
                          'rapid_resale', 'other'
                        )),
  severity              text not null
                        check (severity in ('low', 'medium', 'high', 'critical')),
  description           text not null,
  evidence              jsonb default '{}'::jsonb,  -- supporting data points

  -- Review workflow
  status                text not null default 'open'
                        check (status in ('open', 'under_review', 'confirmed', 'dismissed', 'escalated')),
  reviewed_by           uuid references profiles(id),
  reviewed_at           timestamptz,
  review_notes          text,

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz                -- soft delete only
);

create index idx_fraud_flags_loan     on fraud_flags(loan_application_id, status);
create index idx_fraud_flags_severity on fraud_flags(severity) where status = 'open';

select attach_audit_triggers('fraud_flags');

alter table fraud_flags enable row level security;

create policy "fraud_flags_staff" on fraud_flags
  for all using (
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('underwriter', 'admin')
    )
  );

-- ------------------------------------------------------------
-- analytics_events
-- Behavioural event stream. Append-only. Powers M16 analytics.
-- ------------------------------------------------------------
create table analytics_events (
  id                    uuid primary key default uuid_generate_v4(),
  organization_id       uuid not null references organizations(id),
  actor_id              uuid references profiles(id),
  loan_application_id   uuid references loan_applications(id),

  event_name            text not null,
  -- Examples:
  -- borrower.app_step_completed
  -- borrower.app_abandoned
  -- borrower.document_uploaded
  -- lo.pipeline_viewed
  -- lo.loan_approved
  -- system.ai_analysis_triggered

  properties            jsonb default '{}'::jsonb,
  -- { step: 3, step_name: "employment", time_spent_seconds: 142 }

  -- Session context
  session_id            text,
  device_type           text check (device_type in ('desktop', 'mobile', 'tablet', 'unknown')),
  browser               text,

  -- Append-only timestamp only
  created_at            timestamptz not null default now()
);

create index idx_analytics_org      on analytics_events(organization_id, event_name, created_at desc);
create index idx_analytics_loan     on analytics_events(loan_application_id) where loan_application_id is not null;
create index idx_analytics_actor    on analytics_events(actor_id, created_at desc);

-- Append-only: no updates, no deletes
alter table analytics_events enable row level security;

create policy "analytics_no_update" on analytics_events
  as restrictive for update using (false);

create policy "analytics_no_delete" on analytics_events
  as restrictive for delete using (false);

create policy "analytics_insert" on analytics_events
  for insert with check (true);

create policy "analytics_admin_read" on analytics_events
  for select using (
    organization_id in (
      select organization_id from profiles
      where id = auth.uid() and role = 'admin'
    )
  );
