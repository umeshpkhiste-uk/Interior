-- Organization membership helpers, split out from extensions_and_helpers
-- because they reference organization_members, which the tenancy migration
-- (applied just before this one) creates. See the note in
-- extensions_and_helpers.sql for why they can't live there.
--
-- security definer: these must read organization_members regardless of the
-- RLS policies placed ON organization_members itself, otherwise every
-- policy that calls them would recurse.

create or replace function app.current_org_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select organization_id
  from organization_members
  where user_id = auth.uid();
$$;

create or replace function app.user_role(p_org_id uuid)
returns public.org_role
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select role
  from organization_members
  where organization_id = p_org_id
    and user_id = auth.uid()
  limit 1;
$$;

create or replace function app.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from organization_members
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

-- True if the current user belongs to the org (any role), or is a
-- super_admin (who bypasses organization scoping entirely per
-- DATABASE_SCHEMA.md's RLS strategy point 4).
create or replace function app.is_org_member(p_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select app.is_super_admin() or exists (
    select 1 from organization_members
    where organization_id = p_org_id and user_id = auth.uid()
  );
$$;

-- True if the current user's role in the org is one of p_roles, or is a
-- super_admin.
create or replace function app.has_org_role(p_org_id uuid, p_roles public.org_role[])
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select app.is_super_admin() or app.user_role(p_org_id) = any(p_roles);
$$;

grant execute on function app.current_org_ids() to authenticated;
grant execute on function app.user_role(uuid) to authenticated;
grant execute on function app.is_super_admin() to authenticated;
grant execute on function app.is_org_member(uuid) to authenticated;
grant execute on function app.has_org_role(uuid, public.org_role[]) to authenticated;
