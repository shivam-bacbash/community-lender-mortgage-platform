-- ============================================================
-- loan/003_borrower_details.sql
-- Borrower profile, employment, assets, liabilities.
-- All FK to loan_applications + profiles.
-- ============================================================

-- ------------------------------------------------------------
-- borrower_profiles
-- PII-heavy table. SSN encrypted via pgcrypto.
-- ------------------------------------------------------------
create table borrower_profiles (
  id                    uuid primary key default uuid_generate_v4(),
  profile_id            uuid not null references profiles(id) on delete cascade,
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,

  -- PII (SSN stored encrypted)
  ssn_encrypted         text,                       -- pgp_sym_encrypt(ssn, app_secret)
  dob                   date,
  marital_status        text check (marital_status in ('single', 'married', 'separated')),
  dependents_count      integer default 0,
  citizenship           text check (citizenship in ('us_citizen', 'permanent_resident', 'non_permanent_resident')),

  -- Addresses
  address_current       jsonb default '{}'::jsonb,  -- { street, city, state, zip, county }
  address_mailing       jsonb default '{}'::jsonb,
  years_at_address      numeric(4,1),
  housing_status        text check (housing_status in ('own', 'rent', 'living_with_family')),
  monthly_housing_payment numeric(10,2),

  -- Declarations (URLA Section VII)
  declarations          jsonb default '{}'::jsonb,  -- bankruptcy, foreclosure, lawsuits etc.

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz,

  unique(profile_id, loan_application_id)
);

create index idx_borrower_profiles_loan on borrower_profiles(loan_application_id);
create index idx_borrower_profiles_user on borrower_profiles(profile_id);

select attach_audit_triggers('borrower_profiles');

alter table borrower_profiles enable row level security;

create policy "borrower_profiles_own" on borrower_profiles
  for all using (profile_id = auth.uid());

create policy "borrower_profiles_staff" on borrower_profiles
  for select using (
    loan_application_id in (
      select la.id from loan_applications la
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );

-- ------------------------------------------------------------
-- employment_records
-- ------------------------------------------------------------
create table employment_records (
  id                    uuid primary key default uuid_generate_v4(),
  borrower_profile_id   uuid not null references borrower_profiles(id) on delete cascade,

  employer_name         text not null,
  employer_address      jsonb default '{}'::jsonb,
  employer_phone        text,
  position              text,
  employment_type       text not null
                        check (employment_type in ('w2', 'self_employed', '1099', 'retired', 'other')),
  start_date            date,
  end_date              date,                       -- null if currently employed
  is_current            boolean not null default true,
  is_primary            boolean not null default true,

  -- Income
  base_monthly_income   numeric(12,2),
  overtime_monthly      numeric(12,2) default 0,
  bonus_monthly         numeric(12,2) default 0,
  commission_monthly    numeric(12,2) default 0,
  other_monthly         numeric(12,2) default 0,

  -- Verification
  verified_at           timestamptz,
  verified_via          text check (verified_via in ('plaid', 'manual', 'voe', 'paystub')),

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_employment_borrower on employment_records(borrower_profile_id);

select attach_audit_triggers('employment_records');

alter table employment_records enable row level security;

create policy "employment_own" on employment_records
  for all using (
    borrower_profile_id in (
      select id from borrower_profiles where profile_id = auth.uid()
    )
  );

create policy "employment_staff" on employment_records
  for select using (
    borrower_profile_id in (
      select bp.id from borrower_profiles bp
      join loan_applications la on la.id = bp.loan_application_id
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );

-- ------------------------------------------------------------
-- assets
-- ------------------------------------------------------------
create table assets (
  id                    uuid primary key default uuid_generate_v4(),
  borrower_profile_id   uuid not null references borrower_profiles(id) on delete cascade,

  asset_type            text not null
                        check (asset_type in (
                          'checking', 'savings', 'money_market', 'cd',
                          '401k', 'ira', 'stocks', 'bonds',
                          'real_estate', 'gift', 'other'
                        )),
  institution_name      text,
  account_last4         text,
  balance               numeric(15,2) not null,
  is_gift               boolean not null default false,
  gift_source           text,                       -- if is_gift: family/employer/grant

  -- Verification
  verified_via          text check (verified_via in ('plaid', 'manual', 'statement')),
  verified_at           timestamptz,

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_assets_borrower on assets(borrower_profile_id);

select attach_audit_triggers('assets');

alter table assets enable row level security;

create policy "assets_own" on assets
  for all using (
    borrower_profile_id in (
      select id from borrower_profiles where profile_id = auth.uid()
    )
  );

create policy "assets_staff" on assets
  for select using (
    borrower_profile_id in (
      select bp.id from borrower_profiles bp
      join loan_applications la on la.id = bp.loan_application_id
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );

-- ------------------------------------------------------------
-- liabilities
-- ------------------------------------------------------------
create table liabilities (
  id                    uuid primary key default uuid_generate_v4(),
  borrower_profile_id   uuid not null references borrower_profiles(id) on delete cascade,

  liability_type        text not null
                        check (liability_type in (
                          'mortgage', 'auto', 'student', 'credit_card',
                          'personal_loan', 'child_support', 'alimony', 'other'
                        )),
  creditor_name         text,
  account_number_last4  text,
  monthly_payment       numeric(10,2) not null,
  outstanding_balance   numeric(15,2),
  months_remaining      integer,
  to_be_paid_off        boolean not null default false,
  exclude_from_dti      boolean not null default false,
  exclude_reason        text,                       -- required if exclude_from_dti = true

  -- Audit columns
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index idx_liabilities_borrower on liabilities(borrower_profile_id);

select attach_audit_triggers('liabilities');

alter table liabilities enable row level security;

create policy "liabilities_own" on liabilities
  for all using (
    borrower_profile_id in (
      select id from borrower_profiles where profile_id = auth.uid()
    )
  );

create policy "liabilities_staff" on liabilities
  for select using (
    borrower_profile_id in (
      select bp.id from borrower_profiles bp
      join loan_applications la on la.id = bp.loan_application_id
      join profiles p on p.organization_id = la.organization_id
      where p.id = auth.uid()
      and p.role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );
