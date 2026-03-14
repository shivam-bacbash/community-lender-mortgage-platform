do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'borrower_profiles'
      and policyname = 'borrower_profiles_staff'
  ) then
    create policy "borrower_profiles_staff" on borrower_profiles
      for select using (
        loan_application_id in (
          select la.id from loan_applications la
          join profiles p on p.organization_id = la.organization_id
          where p.id = auth.uid()
          and p.role in ('loan_officer', 'processor', 'underwriter', 'admin')
        )
      );
  end if;
end
$$;

create table if not exists employment_records (
  id                    uuid primary key default uuid_generate_v4(),
  borrower_profile_id   uuid not null references borrower_profiles(id) on delete cascade,
  employer_name         text not null,
  employer_address      jsonb default '{}'::jsonb,
  employer_phone        text,
  position              text,
  employment_type       text not null
                        check (employment_type in ('w2', 'self_employed', '1099', 'retired', 'other')),
  start_date            date,
  end_date              date,
  is_current            boolean not null default true,
  is_primary            boolean not null default true,
  base_monthly_income   numeric(12,2),
  overtime_monthly      numeric(12,2) default 0,
  bonus_monthly         numeric(12,2) default 0,
  commission_monthly    numeric(12,2) default 0,
  other_monthly         numeric(12,2) default 0,
  verified_at           timestamptz,
  verified_via          text check (verified_via in ('plaid', 'manual', 'voe', 'paystub')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index if not exists idx_employment_borrower on employment_records(borrower_profile_id);
select attach_audit_triggers('employment_records')
where not exists (
  select 1 from pg_trigger where tgname = 'trg_employment_records_created_ts'
);
alter table employment_records enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'employment_records' and policyname = 'employment_own'
  ) then
    create policy "employment_own" on employment_records
      for all using (
        borrower_profile_id in (
          select id from borrower_profiles where profile_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'employment_records' and policyname = 'employment_staff'
  ) then
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
  end if;
end
$$;

create table if not exists assets (
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
  gift_source           text,
  verified_via          text check (verified_via in ('plaid', 'manual', 'statement')),
  verified_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index if not exists idx_assets_borrower on assets(borrower_profile_id);
select attach_audit_triggers('assets')
where not exists (
  select 1 from pg_trigger where tgname = 'trg_assets_created_ts'
);
alter table assets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'assets' and policyname = 'assets_own'
  ) then
    create policy "assets_own" on assets
      for all using (
        borrower_profile_id in (
          select id from borrower_profiles where profile_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'assets' and policyname = 'assets_staff'
  ) then
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
  end if;
end
$$;

create table if not exists liabilities (
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
  exclude_reason        text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index if not exists idx_liabilities_borrower on liabilities(borrower_profile_id);
select attach_audit_triggers('liabilities')
where not exists (
  select 1 from pg_trigger where tgname = 'trg_liabilities_created_ts'
);
alter table liabilities enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'liabilities' and policyname = 'liabilities_own'
  ) then
    create policy "liabilities_own" on liabilities
      for all using (
        borrower_profile_id in (
          select id from borrower_profiles where profile_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'liabilities' and policyname = 'liabilities_staff'
  ) then
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
  end if;
end
$$;
