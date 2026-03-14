do $$
declare
  seed_org_id uuid := '11111111-1111-1111-1111-111111111111';
  instance_uuid uuid := '00000000-0000-0000-0000-000000000000';
  seed_password text := 'Password123!';
  seed_user record;
  resolved_user_id uuid;
begin
  insert into public.organizations (
    id,
    name,
    slug,
    plan,
    is_active
  )
  values (
    seed_org_id,
    'First Community Bank',
    'first-community-bank',
    'pro',
    true
  )
  on conflict (id) do update
  set
    name = excluded.name,
    slug = excluded.slug,
    plan = excluded.plan,
    is_active = excluded.is_active,
    updated_at = now();

  if not exists (
    select 1 from public.pipeline_stages where organization_id = seed_org_id
  ) then
    perform public.seed_default_pipeline_stages(seed_org_id);
  end if;

  for seed_user in
    select *
    from (
      values
        ('22222222-2222-2222-2222-222222222221'::uuid, 'borrower.demo@nexuslend.local', 'borrower', 'Borrower', 'Demo', '+15550000001'),
        ('22222222-2222-2222-2222-222222222222'::uuid, 'loan.officer.demo@nexuslend.local', 'loan_officer', 'Loan', 'Officer', '+15550000002'),
        ('22222222-2222-2222-2222-222222222223'::uuid, 'processor.demo@nexuslend.local', 'processor', 'Process', 'Owner', '+15550000003'),
        ('22222222-2222-2222-2222-222222222224'::uuid, 'underwriter.demo@nexuslend.local', 'underwriter', 'Under', 'Writer', '+15550000004'),
        ('22222222-2222-2222-2222-222222222225'::uuid, 'admin.demo@nexuslend.local', 'admin', 'Admin', 'Demo', '+15550000005')
    ) as t(id, email, role, first_name, last_name, phone)
  loop
    select id
    into resolved_user_id
    from auth.users
    where email = seed_user.email
      and is_sso_user = false
    limit 1;

    if resolved_user_id is null then
      resolved_user_id := seed_user.id;

      insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        email_change_confirm_status,
        is_sso_user,
        is_anonymous
      )
      values (
        instance_uuid,
        resolved_user_id,
        'authenticated',
        'authenticated',
        seed_user.email,
        crypt(seed_password, gen_salt('bf')),
        now(),
        '',
        '',
        '',
        '',
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        jsonb_build_object(
          'first_name', seed_user.first_name,
          'last_name', seed_user.last_name,
          'role', seed_user.role
        ),
        now(),
        now(),
        seed_user.phone,
        now(),
        0,
        false,
        false
      );
    else
      update auth.users
      set
        encrypted_password = crypt(seed_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        confirmation_token = '',
        email_change = '',
        email_change_token_new = '',
        recovery_token = '',
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', array['email']),
        raw_user_meta_data = jsonb_build_object(
          'first_name', seed_user.first_name,
          'last_name', seed_user.last_name,
          'role', seed_user.role
        ),
        updated_at = now(),
        phone = seed_user.phone,
        phone_confirmed_at = now(),
        deleted_at = null,
        is_sso_user = false,
        is_anonymous = false
      where id = resolved_user_id;
    end if;

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      resolved_user_id,
      jsonb_build_object(
        'sub', resolved_user_id::text,
        'email', seed_user.email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      seed_user.email,
      now(),
      now(),
      now()
    )
    on conflict (provider_id, provider) do update
    set
      user_id = excluded.user_id,
      identity_data = excluded.identity_data,
      last_sign_in_at = excluded.last_sign_in_at,
      updated_at = excluded.updated_at;

    insert into public.profiles (
      id,
      organization_id,
      role,
      first_name,
      last_name,
      phone,
      is_active
    )
    values (
      resolved_user_id,
      seed_org_id,
      seed_user.role,
      seed_user.first_name,
      seed_user.last_name,
      seed_user.phone,
      true
    )
    on conflict (id) do update
    set
      organization_id = excluded.organization_id,
      role = excluded.role,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      phone = excluded.phone,
      is_active = excluded.is_active,
      deleted_at = null,
      updated_at = now();
  end loop;
end
$$;
