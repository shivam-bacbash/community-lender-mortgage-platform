-- ============================================================
-- core/004_auth_profile_trigger.sql
-- Creates borrower profiles automatically on auth signup.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  request_host text := nullif(metadata ->> 'organization_host', '');
  normalized_host text := nullif(split_part(coalesce(request_host, ''), ':', 1), '');
  candidate_slug text;
  organization_id uuid;
begin
  if normalized_host is not null and array_length(string_to_array(normalized_host, '.'), 1) > 2 then
    candidate_slug := split_part(normalized_host, '.', 1);
  else
    candidate_slug := 'default';
  end if;

  select id
  into organization_id
  from organizations
  where is_active = true
    and (
      custom_domain = normalized_host
      or slug = candidate_slug
    )
  order by
    case
      when custom_domain = normalized_host then 0
      when slug = candidate_slug then 1
      else 2
    end,
    created_at asc
  limit 1;

  if organization_id is null then
    select id
    into organization_id
    from organizations
    where is_active = true
    order by created_at asc
    limit 1;
  end if;

  if organization_id is null then
    raise exception 'No active organization found. Seed an organization before allowing borrower registration.';
  end if;

  insert into profiles (
    id,
    organization_id,
    role,
    first_name,
    last_name,
    phone
  )
  values (
    new.id,
    organization_id,
    'borrower',
    coalesce(nullif(metadata ->> 'first_name', ''), 'Borrower'),
    coalesce(nullif(metadata ->> 'last_name', ''), 'User'),
    nullif(metadata ->> 'phone', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
