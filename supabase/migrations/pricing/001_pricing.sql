-- ============================================================
-- pricing/001_pricing.sql
-- Loan products, rate sheets, fees, and rate locks.
-- ============================================================

-- ------------------------------------------------------------
-- loan_products
-- ------------------------------------------------------------
create table loan_products (
  id                    uuid primary key default uuid_generate_v4(),
  organization_id       uuid not null references organizations(id) on delete cascade,

  name                  text not null,
  loan_type             text not null check (loan_type in ('conventional', 'fha', 'va', 'usda', 'jumbo')),
  term_months           integer not null,           -- 360, 180, 120
  amortization_type     text not null check (amortization_type in ('fixed', 'arm')),
  arm_initial_period    integer,                    -- months fixed before first adjustment (ARM only)

  -- Eligibility guidelines stored as JSON for flexibility
  guidelines            jsonb default '{}'::jsonb,
  -- {
  --   "min_credit_score": 620,
  --   "max_dti": 0.45,
  --   "max_ltv": 0.97,
  --   "min_loan_amount": 50000,
  --   "max_loan_amount": 726200
  -- }

  description           text,
  is_active             boolean not null default true,
  display_order         integer default 0,

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_loan_products_org on loan_products(organization_id, is_active);

select attach_audit_triggers('loan_products');

alter table loan_products enable row level security;

create policy "loan_products_read" on loan_products
  for select using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

create policy "loan_products_manage" on loan_products
  for all using (
    organization_id in (
      select organization_id from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- rate_sheets
-- Daily rate matrix per product. rate_data is LTV/FICO matrix.
-- ------------------------------------------------------------
create table rate_sheets (
  id                    uuid primary key default uuid_generate_v4(),
  organization_id       uuid not null references organizations(id) on delete cascade,
  loan_product_id       uuid not null references loan_products(id) on delete cascade,

  effective_date        date not null,
  expiry_date           date,

  -- Rate matrix as JSON: keyed by LTV and FICO bands
  rate_data             jsonb not null default '{}'::jsonb,
  -- Example structure:
  -- {
  --   "ltv_80_fico_760": { "rate": 6.875, "points": 0 },
  --   "ltv_80_fico_740": { "rate": 7.000, "points": 0 },
  --   ...
  -- }

  margin                numeric(5,4) default 0,     -- lender margin applied on top
  is_active             boolean not null default true,

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_rate_sheets_product on rate_sheets(loan_product_id, effective_date);

select attach_audit_triggers('rate_sheets');

alter table rate_sheets enable row level security;

create policy "rate_sheets_read" on rate_sheets
  for select using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

create policy "rate_sheets_manage" on rate_sheets
  for all using (
    organization_id in (
      select organization_id from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- loan_fees
-- Itemized fees per loan (LE / CD line items).
-- ------------------------------------------------------------
create table loan_fees (
  id                    uuid primary key default uuid_generate_v4(),
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,

  fee_type              text not null
                        check (fee_type in (
                          'origination', 'discount_point', 'appraisal',
                          'credit_report', 'flood_cert', 'title_search',
                          'title_insurance', 'recording', 'transfer_tax',
                          'homeowners_insurance', 'prepaid_interest',
                          'escrow_setup', 'attorney', 'survey', 'other'
                        )),
  fee_name              text not null,
  amount                numeric(10,2) not null,
  paid_by               text not null default 'borrower'
                        check (paid_by in ('borrower', 'seller', 'lender', 'other')),

  -- LE/CD disclosure section (TRID)
  disclosure_section    text check (disclosure_section in ('A', 'B', 'C', 'E', 'F', 'G', 'H')),
  can_increase          boolean not null default false, -- 0% / 10% / unlimited tolerance bucket
  tolerance_bucket      text check (tolerance_bucket in ('zero', 'ten_percent', 'unlimited')),

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_loan_fees_loan on loan_fees(loan_application_id);

select attach_audit_triggers('loan_fees');

alter table loan_fees enable row level security;

create policy "loan_fees_read" on loan_fees
  for select using (
    loan_application_id in (
      select id from loan_applications
      where borrower_id = auth.uid() or co_borrower_id = auth.uid()
    )
    or
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
    )
  );

create policy "loan_fees_staff_write" on loan_fees
  for all using (
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'admin')
    )
  );

-- ------------------------------------------------------------
-- rate_locks
-- ------------------------------------------------------------
create table rate_locks (
  id                    uuid primary key default uuid_generate_v4(),
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,
  loan_product_id       uuid references loan_products(id),
  locked_by             uuid references profiles(id),

  rate                  numeric(6,4) not null,      -- e.g. 6.8750
  apr                   numeric(6,4),
  points                numeric(5,4) default 0,
  lock_period_days      integer not null,           -- 15, 30, 45, 60

  locked_at             timestamptz not null default now(),
  expires_at            timestamptz not null,
  extended_to           timestamptz,               -- if lock was extended

  status                text not null default 'active'
                        check (status in ('active', 'expired', 'extended', 'cancelled', 'delivered')),

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_rate_locks_loan   on rate_locks(loan_application_id);
create index idx_rate_locks_status on rate_locks(status, expires_at);

select attach_audit_triggers('rate_locks');

alter table rate_locks enable row level security;

create policy "rate_locks_read" on rate_locks
  for select using (
    loan_application_id in (
      select id from loan_applications
      where borrower_id = auth.uid() or co_borrower_id = auth.uid()
    )
    or
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
    )
  );

create policy "rate_locks_staff_write" on rate_locks
  for all using (
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'admin')
    )
  );
