-- ============================================================
-- borrower portal support
-- Adds borrower draft updates, borrower-facing AI visibility,
-- and a secure RPC helper for SSN encryption during M2.
-- ============================================================

create policy "loan_apps_borrower_update" on loan_applications
  for update using (
    borrower_id = auth.uid() or co_borrower_id = auth.uid()
  )
  with check (
    borrower_id = auth.uid() or co_borrower_id = auth.uid()
  );

create policy "ai_analyses_borrower_prequal_read" on ai_analyses
  for select using (
    analysis_type = 'prequalification'
    and loan_application_id in (
      select id from loan_applications
      where borrower_id = auth.uid() or co_borrower_id = auth.uid()
    )
  );

create or replace function public.upsert_borrower_profile_secure(
  p_loan_application_id uuid,
  p_ssn text default null,
  p_dob date default null,
  p_marital_status text default null,
  p_dependents_count integer default null,
  p_citizenship text default null,
  p_address_current jsonb default null,
  p_years_at_address numeric default null,
  p_housing_status text default null,
  p_monthly_housing_payment numeric default null,
  p_secret text default null
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_profile_id uuid;
  v_borrower_profile_id uuid;
  v_encrypted_ssn text;
begin
  select auth.uid() into v_profile_id;

  if v_profile_id is null then
    raise exception 'Authenticated user required';
  end if;

  if not exists (
    select 1
    from loan_applications
    where id = p_loan_application_id
      and (borrower_id = v_profile_id or co_borrower_id = v_profile_id)
  ) then
    raise exception 'Loan application not found for borrower';
  end if;

  if p_ssn is not null and length(trim(p_ssn)) > 0 then
    if p_secret is null or length(trim(p_secret)) = 0 then
      raise exception 'APP secret is required to encrypt SSN';
    end if;

    v_encrypted_ssn := pgp_sym_encrypt(trim(p_ssn), p_secret)::text;
  end if;

  insert into borrower_profiles (
    profile_id,
    loan_application_id,
    ssn_encrypted,
    dob,
    marital_status,
    dependents_count,
    citizenship,
    address_current,
    years_at_address,
    housing_status,
    monthly_housing_payment
  )
  values (
    v_profile_id,
    p_loan_application_id,
    v_encrypted_ssn,
    p_dob,
    p_marital_status,
    p_dependents_count,
    p_citizenship,
    coalesce(p_address_current, '{}'::jsonb),
    p_years_at_address,
    p_housing_status,
    p_monthly_housing_payment
  )
  on conflict (profile_id, loan_application_id) do update set
    ssn_encrypted = coalesce(excluded.ssn_encrypted, borrower_profiles.ssn_encrypted),
    dob = coalesce(excluded.dob, borrower_profiles.dob),
    marital_status = coalesce(excluded.marital_status, borrower_profiles.marital_status),
    dependents_count = coalesce(excluded.dependents_count, borrower_profiles.dependents_count),
    citizenship = coalesce(excluded.citizenship, borrower_profiles.citizenship),
    address_current = case
      when p_address_current is null then borrower_profiles.address_current
      else excluded.address_current
    end,
    years_at_address = coalesce(excluded.years_at_address, borrower_profiles.years_at_address),
    housing_status = coalesce(excluded.housing_status, borrower_profiles.housing_status),
    monthly_housing_payment = coalesce(
      excluded.monthly_housing_payment,
      borrower_profiles.monthly_housing_payment
    )
  returning id into v_borrower_profile_id;

  return v_borrower_profile_id;
end;
$$;

grant execute on function public.upsert_borrower_profile_secure(
  uuid,
  text,
  date,
  text,
  integer,
  text,
  jsonb,
  numeric,
  text,
  numeric,
  text
) to authenticated;
