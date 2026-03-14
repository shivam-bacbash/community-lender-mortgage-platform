-- ============================================================
-- core/005_fix_profiles_rls_recursion.sql
-- Rewrites profiles RLS policies to avoid self-referential recursion.
-- ============================================================

create or replace function public.current_profile_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

create or replace function public.current_profile_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (
    organization_id = public.current_profile_organization_id()
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update
  using (
    public.current_profile_is_admin()
    and organization_id = public.current_profile_organization_id()
  )
  with check (
    public.current_profile_is_admin()
    and organization_id = public.current_profile_organization_id()
  );
