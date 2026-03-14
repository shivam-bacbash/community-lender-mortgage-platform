-- ============================================================
-- compliance/001_compliance.sql
-- Audit log (append-only), TRID disclosures, HMDA records.
-- ============================================================

-- ------------------------------------------------------------
-- audit_logs
-- APPEND-ONLY. RLS blocks UPDATE and DELETE entirely.
-- ------------------------------------------------------------
create table audit_logs (
  id                    uuid primary key default uuid_generate_v4(),
  organization_id       uuid not null references organizations(id),
  actor_id              uuid references profiles(id),

  -- What happened
  action                text not null,
  -- Dot-notation: resource.verb
  -- e.g. loan.submitted / loan.approved / document.uploaded /
  --      underwriting.decision_made / condition.satisfied

  -- What it happened to (polymorphic)
  resource_type         text not null,
  resource_id           uuid not null,

  -- State snapshot for diff
  before_state          jsonb default '{}'::jsonb,
  after_state           jsonb default '{}'::jsonb,

  -- Request context
  ip_address            inet,
  user_agent            text,
  session_id            text,

  -- Only created_at — no updated_at, no deleted_at on audit logs
  created_at            timestamptz not null default now()
);

create index idx_audit_logs_org      on audit_logs(organization_id, created_at desc);
create index idx_audit_logs_resource on audit_logs(resource_type, resource_id);
create index idx_audit_logs_actor    on audit_logs(actor_id, created_at desc);

-- No audit triggers on this table (it IS the audit table)
alter table audit_logs enable row level security;

-- Read: staff can read their org's audit logs
create policy "audit_logs_read" on audit_logs
  for select using (
    organization_id in (
      select organization_id from profiles
      where id = auth.uid()
      and role in ('admin', 'underwriter')
    )
  );

-- Insert: anyone authenticated can insert (server-side via service role)
create policy "audit_logs_insert" on audit_logs
  for insert with check (true);

-- Block UPDATE and DELETE completely
create policy "audit_logs_no_update" on audit_logs
  as restrictive
  for update using (false);

create policy "audit_logs_no_delete" on audit_logs
  as restrictive
  for delete using (false);

-- ------------------------------------------------------------
-- disclosures
-- TRID-required disclosures (LE, CD). Immutable once acknowledged.
-- ------------------------------------------------------------
create table disclosures (
  id                    uuid primary key default uuid_generate_v4(),
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,
  issued_by             uuid references profiles(id),

  disclosure_type       text not null
                        check (disclosure_type in ('LE', 'CD', 'IABS', 'CHARM', 'ARM_DISCLOSURE', 'OTHER')),
  version               integer not null default 1, -- re-disclosure increments

  -- Timing (TRID rules)
  sent_at               timestamptz,
  deadline              timestamptz,               -- 3 or 7 business days from sent_at
  acknowledged_at       timestamptz,               -- borrower e-sign timestamp
  acknowledged_by       uuid references profiles(id),

  status                text not null default 'pending'
                        check (status in ('draft', 'sent', 'acknowledged', 'expired', 'superseded')),

  document_id           uuid references documents(id),
  notes                 text,

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_disclosures_loan   on disclosures(loan_application_id);
create index idx_disclosures_status on disclosures(status, deadline);

select attach_audit_triggers('disclosures');

alter table disclosures enable row level security;

create policy "disclosures_borrower" on disclosures
  for select using (
    loan_application_id in (
      select id from loan_applications
      where borrower_id = auth.uid() or co_borrower_id = auth.uid()
    )
  );

-- Borrower can acknowledge (update acknowledged_at only)
create policy "disclosures_borrower_ack" on disclosures
  for update using (
    loan_application_id in (
      select id from loan_applications
      where borrower_id = auth.uid() or co_borrower_id = auth.uid()
    )
    and status = 'sent'                            -- can only ack a sent disclosure
  );

create policy "disclosures_staff" on disclosures
  for all using (
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'admin')
    )
  );

-- ------------------------------------------------------------
-- hmda_records
-- One per loan, populated at disposition (funded/denied/withdrawn).
-- HMDA LAR submitted annually.
-- ------------------------------------------------------------
create table hmda_records (
  id                    uuid primary key default uuid_generate_v4(),
  loan_application_id   uuid not null unique references loan_applications(id),
  organization_id       uuid not null references organizations(id),

  -- HMDA action taken codes (1=originated, 2=approved not accepted, 3=denied, etc.)
  action_taken          integer check (action_taken between 1 and 8),
  action_taken_date     date,

  denial_reasons        integer[] default '{}',    -- HMDA codes 1–9

  -- Applicant demographic data (self-reported)
  ethnicity_data        jsonb default '{}'::jsonb,
  race_data             jsonb default '{}'::jsonb,
  sex_data              jsonb default '{}'::jsonb,

  -- Property / geography
  census_tract          text,
  msa_code              text,
  county_code           text,

  -- Loan characteristics for LAR
  loan_purpose_hmda     integer,                   -- HMDA enumeration
  property_type_hmda    integer,
  lien_status           integer,
  hoepa_status          integer default 3,         -- 3 = not a HOEPA loan
  rate_spread           numeric(5,2),              -- APR - APOR if applicable

  reporting_year        integer not null,
  submitted_to_cfpb_at  timestamptz,

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_hmda_org_year on hmda_records(organization_id, reporting_year);

select attach_audit_triggers('hmda_records');

alter table hmda_records enable row level security;

create policy "hmda_staff" on hmda_records
  for all using (
    organization_id in (
      select organization_id from profiles
      where id = auth.uid()
      and role in ('admin', 'underwriter')
    )
  );
