-- ============================================================
-- core/001_organizations.sql
-- Root tenant table. Every other table scopes to organization_id.
-- ============================================================

create table organizations (
  id                uuid primary key default uuid_generate_v4(),

  -- Identity
  name              text not null,
  slug              text not null unique,         -- used as subdomain key e.g. "firstbank"
  logo_url          text,

  -- White-label (Phase 4 / M17)
  brand_colors      jsonb default '{}'::jsonb,    -- { primary, secondary, accent }
  custom_domain     text unique,                  -- e.g. "loans.firstbank.com"

  -- Feature flags & settings (controls per-tenant feature rollout)
  settings          jsonb default '{}'::jsonb,

  -- Subscription / plan
  plan              text not null default 'starter'
                    check (plan in ('starter', 'pro', 'enterprise')),
  plan_expires_at   timestamptz,

  -- Status
  is_active         boolean not null default true,

  -- Audit columns (populated by triggers)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id),
  deleted_at        timestamptz                   -- soft delete
);

-- Indexes
create index idx_organizations_slug     on organizations(slug);
create index idx_organizations_active   on organizations(is_active) where is_active = true;

-- Audit triggers
select attach_audit_triggers('organizations');

-- RLS
alter table organizations enable row level security;

-- Admins can read their own org; superadmin (service role) can read all
create policy "org_select" on organizations
  for select using (
    id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

create policy "org_update" on organizations
  for update using (
    id in (
      select organization_id from profiles
      where id = auth.uid() and role = 'admin'
    )
  );
