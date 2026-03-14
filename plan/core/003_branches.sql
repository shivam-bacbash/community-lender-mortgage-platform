-- ============================================================
-- core/003_branches.sql
-- Branches within an organization, and their members.
-- ============================================================

-- ------------------------------------------------------------
-- branches
-- ------------------------------------------------------------
create table branches (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references organizations(id) on delete cascade,

  name              text not null,
  nmls_id           text,
  address           jsonb default '{}'::jsonb,    -- { street, city, state, zip }
  phone             text,
  manager_id        uuid references profiles(id),

  is_active         boolean not null default true,

  -- Audit columns
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  deleted_at        timestamptz
);

create index idx_branches_org on branches(organization_id);

select attach_audit_triggers('branches');

alter table branches enable row level security;

create policy "branches_select" on branches
  for select using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

create policy "branches_manage" on branches
  for all using (
    organization_id in (
      select organization_id from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- branch_members
-- ------------------------------------------------------------
create table branch_members (
  id                uuid primary key default uuid_generate_v4(),
  branch_id         uuid not null references branches(id) on delete cascade,
  profile_id        uuid not null references profiles(id) on delete cascade,
  is_primary        boolean not null default true,

  -- Audit columns
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  deleted_at        timestamptz,

  unique(branch_id, profile_id)
);

create index idx_branch_members_branch  on branch_members(branch_id);
create index idx_branch_members_profile on branch_members(profile_id);

select attach_audit_triggers('branch_members');

alter table branch_members enable row level security;

create policy "branch_members_select" on branch_members
  for select using (
    branch_id in (
      select b.id from branches b
      join profiles p on p.organization_id = b.organization_id
      where p.id = auth.uid()
    )
  );
