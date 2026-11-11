-- Phase 5 support: an atomic per-organization project code sequence, and a
-- security-definer function to list organization members with their email
-- (profiles intentionally does not mirror auth.users.email, so member
-- listings need a safe, scoped way to read it without handing the client
-- the service-role key).

alter table public.organizations
  add column next_project_seq int not null default 1;

create or replace function public.allocate_project_code(p_org_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_seq int;
begin
  if not app.is_org_member(p_org_id) then
    raise exception 'not a member of this organization';
  end if;

  update public.organizations
  set next_project_seq = next_project_seq + 1
  where id = p_org_id
  returning next_project_seq - 1 into v_seq;

  if v_seq is null then
    raise exception 'organization % not found', p_org_id;
  end if;

  return 'PRJ-' || lpad(v_seq::text, 4, '0');
end;
$$;

grant execute on function public.allocate_project_code(uuid) to authenticated;

-- Returns members of an organization the caller belongs to, joining
-- auth.users for email (never exposed via a public.* table/view directly).
create or replace function public.get_organization_members(p_org_id uuid)
returns table (
  member_id uuid,
  user_id uuid,
  email text,
  full_name text,
  role public.org_role,
  invited_at timestamptz,
  accepted_at timestamptz
)
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select
    om.id as member_id,
    om.user_id,
    u.email,
    p.full_name,
    om.role,
    om.invited_at,
    om.accepted_at
  from public.organization_members om
  join auth.users u on u.id = om.user_id
  left join public.profiles p on p.id = om.user_id
  where om.organization_id = p_org_id
    and app.is_org_member(p_org_id)
  order by om.created_at asc;
$$;

grant execute on function public.get_organization_members(uuid) to authenticated;

-- Companion to create_organization_with_owner (Phase 3): when a user was
-- invited to an existing organization (rather than signing up fresh), their
-- auth.users metadata carries invited_organization_id/invited_role. This
-- inserts that membership — bypassing RLS safely, scoped only to
-- auth.uid() — since the invited user has no role in that org yet and
-- can't satisfy organization_members_write on their own. Returns the
-- organization id if this was an invite acceptance, or null otherwise, so
-- the caller (auth callback route) knows whether to fall back to
-- create_organization_with_owner for a fresh signup.
create or replace function public.accept_organization_invite()
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_meta jsonb;
  v_org_id uuid;
  v_role public.org_role;
begin
  if v_user_id is null then
    raise exception 'accept_organization_invite requires an authenticated user';
  end if;

  select raw_user_meta_data into v_meta from auth.users where id = v_user_id;
  v_org_id := (v_meta ->> 'invited_organization_id')::uuid;
  if v_org_id is null then
    return null;
  end if;

  v_role := coalesce((v_meta ->> 'invited_role')::public.org_role, 'designer');

  insert into public.organization_members (organization_id, user_id, role, invited_at, accepted_at)
  values (v_org_id, v_user_id, v_role, now(), now())
  on conflict (organization_id, user_id) do update set accepted_at = now();

  return v_org_id;
end;
$$;

grant execute on function public.accept_organization_invite() to authenticated;
