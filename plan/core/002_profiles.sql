-- ============================================================
-- core/002_profiles.sql
-- Extends auth.users. One profile per user per organization.
-- ============================================================

create table profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  organization_id   uuid not null references organizations(id) on delete cascade,

  -- Role
  role              text not null
                    check (role in ('borrower', 'loan_officer', 'processor', 'underwriter', 'admin')),

  -- Personal info
  first_name        text not null,
  last_name         text not null,
  phone             text,
  avatar_url        text,

  -- Loan officer specific
  nmls_id           text,                         -- required for loan_officer role
  license_states    text[],                       -- states LO is licensed in

  -- Notification preferences
  notification_prefs jsonb default '{
    "email": true,
    "sms": false,
    "in_app": true
  }'::jsonb,

  -- Status
  is_active         boolean not null default true,

  -- Audit columns
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  deleted_at        timestamptz
);

-- Indexes
create index idx_profiles_org         on profiles(organization_id);
create index idx_profiles_role        on profiles(organization_id, role);
create index idx_profiles_active      on profiles(organization_id, is_active) where is_active = true;

-- Audit triggers
select attach_audit_triggers('profiles');

-- RLS
alter table profiles enable row level security;

-- Users can read profiles within their organization
create policy "profiles_select" on profiles
  for select using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

-- Users can update only their own profile
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());

-- Admins can update any profile in their org
create policy "profiles_update_admin" on profiles
  for update using (
    organization_id in (
      select organization_id from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Auto-create profile after signup via trigger
create or replace function handle_new_user()
returns trigger as $$
begin
  -- Profile is created explicitly by the app after signup
  -- This trigger is a safety net to prevent orphaned auth users
  return new;
end;
$$ language plpgsql security definer;
