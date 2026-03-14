-- ============================================================
-- loan/001_pipeline_stages.sql
-- Configurable kanban stages per organization.
-- Must be created before loan_applications (FK dependency).
-- ============================================================

create table pipeline_stages (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references organizations(id) on delete cascade,

  name              text not null,               -- e.g. "Application", "Processing", "Underwriting"
  order_index       integer not null,            -- controls kanban column order
  color             text not null default '#6366f1', -- hex color for kanban UI
  description       text,

  -- Terminal stages don't allow further movement
  is_terminal       boolean not null default false,
  terminal_outcome  text check (terminal_outcome in ('funded', 'denied', 'withdrawn', 'cancelled')),

  -- SLA tracking
  sla_days          integer,                     -- expected max days in this stage

  -- Audit columns
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  deleted_at        timestamptz,

  unique(organization_id, order_index)
);

create index idx_pipeline_stages_org   on pipeline_stages(organization_id);
create index idx_pipeline_stages_order on pipeline_stages(organization_id, order_index);

select attach_audit_triggers('pipeline_stages');

alter table pipeline_stages enable row level security;

create policy "pipeline_stages_select" on pipeline_stages
  for select using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

create policy "pipeline_stages_manage" on pipeline_stages
  for all using (
    organization_id in (
      select organization_id from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Seed default stages for new organizations
create or replace function seed_default_pipeline_stages(org_id uuid)
returns void as $$
begin
  insert into pipeline_stages (organization_id, name, order_index, color, sla_days, is_terminal) values
    (org_id, 'Application',     1, '#6366f1', 2,  false),
    (org_id, 'Processing',      2, '#f59e0b', 7,  false),
    (org_id, 'Underwriting',    3, '#3b82f6', 10, false),
    (org_id, 'Approved',        4, '#10b981', 5,  false),
    (org_id, 'Clear to Close',  5, '#14b8a6', 3,  false),
    (org_id, 'Funded',          6, '#22c55e', null, true),
    (org_id, 'Denied',          7, '#ef4444', null, true),
    (org_id, 'Withdrawn',       8, '#9ca3af', null, true);
end;
$$ language plpgsql;
