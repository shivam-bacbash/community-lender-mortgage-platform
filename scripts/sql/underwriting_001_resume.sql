create table if not exists credit_reports (
  id                    uuid primary key default uuid_generate_v4(),
  borrower_profile_id   uuid not null references borrower_profiles(id) on delete cascade,
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,
  requested_by          uuid references profiles(id),
  bureau                text not null check (bureau in ('experian', 'equifax', 'transunion', 'tri_merge')),
  score                 integer,
  score_model           text,
  report_data           jsonb default '{}'::jsonb,
  reference_number      text,
  pulled_at             timestamptz not null default now(),
  expires_at            timestamptz not null default (now() + interval '120 days'),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index if not exists idx_credit_reports_borrower on credit_reports(borrower_profile_id);
create index if not exists idx_credit_reports_loan on credit_reports(loan_application_id);
select attach_audit_triggers('credit_reports')
where not exists (
  select 1 from pg_trigger where tgname = 'trg_credit_reports_created_ts'
);
alter table credit_reports enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'credit_reports' and policyname = 'credit_reports_staff'
  ) then
    create policy "credit_reports_staff" on credit_reports
      for all using (
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

create table if not exists underwriting_decisions (
  id                    uuid primary key default uuid_generate_v4(),
  loan_application_id   uuid not null references loan_applications(id) on delete cascade,
  underwriter_id        uuid references profiles(id),
  decision              text not null
                        check (decision in ('approved', 'approved_with_conditions', 'suspended', 'denied')),
  decision_pass         integer not null default 1,
  approved_amount       numeric(15,2),
  dti_ratio             numeric(5,4),
  ltv_ratio             numeric(5,4),
  cltv_ratio            numeric(5,4),
  credit_score_used     integer,
  denial_reasons        jsonb default '[]'::jsonb,
  notes                 text,
  decided_at            timestamptz not null default now(),
  ai_summary            jsonb default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  updated_by            uuid references auth.users(id),
  deleted_at            timestamptz
);

create index if not exists idx_uw_decisions_loan on underwriting_decisions(loan_application_id);
create index if not exists idx_uw_decisions_uw on underwriting_decisions(underwriter_id);
select attach_audit_triggers('underwriting_decisions')
where not exists (
  select 1 from pg_trigger where tgname = 'trg_underwriting_decisions_created_ts'
);
alter publication supabase_realtime add table underwriting_decisions;
alter table underwriting_decisions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'underwriting_decisions' and policyname = 'uw_decisions_staff'
  ) then
    create policy "uw_decisions_staff" on underwriting_decisions
      for all using (
        loan_application_id in (
          select la.id from loan_applications la
          join profiles p on p.organization_id = la.organization_id
          where p.id = auth.uid()
          and p.role in ('loan_officer', 'processor', 'underwriter', 'admin')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'underwriting_decisions' and policyname = 'uw_decisions_borrower_select'
  ) then
    create policy "uw_decisions_borrower_select" on underwriting_decisions
      for select using (
        loan_application_id in (
          select id from loan_applications
          where borrower_id = auth.uid() or co_borrower_id = auth.uid()
        )
      );
  end if;
end
$$;
