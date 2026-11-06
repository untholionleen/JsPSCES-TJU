-- TJU-ThermoHub 13.1.0 — least-privilege hardening for the existing thermo_* schema.
-- Idempotent; does not drop or truncate existing user/data records.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.thermo_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.thermo_profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;
revoke all on function private.thermo_is_admin() from public, anon;
grant execute on function private.thermo_is_admin() to authenticated;

-- Move all existing policy checks away from the exposed public RPC function.
do $$
declare r record; q text; c text;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (coalesce(qual,'') like '%thermo_is_admin()%' or coalesce(with_check,'') like '%thermo_is_admin()%')
  loop
    if r.qual is not null then
      q := replace(r.qual, 'thermo_is_admin()', 'private.thermo_is_admin()');
      execute format('alter policy %I on %I.%I using (%s)', r.policyname, r.schemaname, r.tablename, q);
    end if;
    if r.with_check is not null then
      c := replace(r.with_check, 'thermo_is_admin()', 'private.thermo_is_admin()');
      execute format('alter policy %I on %I.%I with check (%s)', r.policyname, r.schemaname, r.tablename, c);
    end if;
  end loop;
end;
$$;

-- The old public function is no longer a public RPC endpoint.
revoke all on function public.thermo_is_admin() from public, anon, authenticated;
-- Trigger-only functions must not be callable as public RPC functions.
revoke all on function public.thermo_handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- Prevent a signed-in user from escalating their own profile role.
create or replace function private.thermo_guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null
     and new.role is distinct from old.role
     and not private.thermo_is_admin() then
    raise exception 'Profile role cannot be changed by the account owner.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.thermo_guard_profile_role() from public, anon, authenticated;
drop trigger if exists thermo_profiles_guard_role on public.thermo_profiles;
create trigger thermo_profiles_guard_role
before update on public.thermo_profiles
for each row execute function private.thermo_guard_profile_role();

-- Explicit Data API grants: RLS remains the row-level authorization boundary.
grant usage on schema public to anon, authenticated;
grant select on public.thermo_data_sources, public.thermo_substances, public.thermo_eos_models,
  public.thermo_property_values, public.thermo_eos_component_parameters,
  public.thermo_binary_parameters, public.thermo_vle_datasets,
  public.thermo_vle_points, public.thermo_model_fits to anon, authenticated;

grant select, update on public.thermo_profiles to authenticated;
grant select, insert, delete on public.thermo_calculation_history to authenticated;
revoke all on public.thermo_calculation_history from anon;

create index if not exists thermo_calculation_history_user_created_idx
  on public.thermo_calculation_history (user_id, created_at desc);

comment on schema private is 'Internal helper functions; keep this schema out of Supabase Data API exposed schemas.';
comment on function private.thermo_is_admin() is 'RLS helper; role comes only from protected thermo_profiles.role, never user-editable metadata.';
