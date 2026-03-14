-- ============================================================
-- loan/002_loan_applications.sql
-- Central table. Every other loan entity FK's to this.
-- ============================================================

create table loan_applications (
  id                  uuid primary key default uuid_generate_v4(),
  organization_id     uuid not null references organizations(id) on delete cascade,

  -- Auto-generated human-readable loan number: LN-2026-00001
  loan_number         text unique,

  -- People
  borrower_id         uuid not null references profiles(id),
  co_borrower_id      uuid references profiles(id),
  loan_officer_id     uuid references profiles(id),
  processor_id        uuid references profiles(id),
  underwriter_id      uuid references profiles(id),
  branch_id           uuid references branches(id),

  -- Pipeline
  pipeline_stage_id   uuid references pipeline_stages(id),
  status              text not null default 'draft'
                      check (status in (
                        'draft', 'submitted', 'processing',
                        'underwriting', 'approved', 'clear_to_close',
                        'funded', 'denied', 'withdrawn', 'cancelled'
                      )),

  -- Loan details
  loan_purpose        text not null
                      check (loan_purpose in ('purchase', 'refinance', 'cash_out', 'construction')),
  loan_type           text not null
                      check (loan_type in ('conventional', 'fha', 'va', 'usda', 'jumbo')),
  loan_amount         numeric(15,2),
  down_payment        numeric(15,2),
  term_months         integer default 360,         -- 360 = 30yr

  -- Key dates
  submitted_at        timestamptz,
  approved_at         timestamptz,
  closed_at           timestamptz,
  funded_at           timestamptz,
  denied_at           timestamptz,
  estimated_closing   date,

  -- Flexible metadata for edge cases
  metadata            jsonb default '{}'::jsonb,

  -- Audit columns
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid references auth.users(id),
  updated_by          uuid references auth.users(id),
  deleted_at          timestamptz
);

-- Indexes
create index idx_loan_apps_org          on loan_applications(organization_id);
create index idx_loan_apps_borrower     on loan_applications(borrower_id);
create index idx_loan_apps_lo           on loan_applications(loan_officer_id);
create index idx_loan_apps_stage        on loan_applications(pipeline_stage_id);
create index idx_loan_apps_status       on loan_applications(status);
create index idx_loan_apps_org_status   on loan_applications(organization_id, status);

select attach_audit_triggers('loan_applications');

-- Auto-generate loan_number: LN-{YEAR}-{5-digit sequence}
create sequence if not exists loan_number_seq;

create or replace function generate_loan_number()
returns trigger as $$
begin
  new.loan_number := 'LN-' || to_char(now(), 'YYYY') || '-' ||
                     lpad(nextval('loan_number_seq')::text, 5, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_loan_apps_loan_number
  before insert on loan_applications
  for each row
  when (new.loan_number is null)
  execute function generate_loan_number();

-- Realtime enabled (configured in Supabase dashboard or via CLI)
alter publication supabase_realtime add table loan_applications;

-- RLS
alter table loan_applications enable row level security;

-- Borrowers see only their own loans
create policy "loan_apps_borrower_select" on loan_applications
  for select using (
    borrower_id = auth.uid() or co_borrower_id = auth.uid()
  );

-- LO, processor, underwriter see loans in their org
create policy "loan_apps_staff_select" on loan_applications
  for select using (
    organization_id in (
      select organization_id from profiles
      where id = auth.uid()
      and role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );

-- Borrowers can insert (submit application)
create policy "loan_apps_borrower_insert" on loan_applications
  for insert with check (
    borrower_id = auth.uid()
  );

-- Staff can update loans in their org
create policy "loan_apps_staff_update" on loan_applications
  for update using (
    organization_id in (
      select organization_id from profiles
      where id = auth.uid()
      and role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );
