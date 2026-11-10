-- Closes a bootstrap gap left by the RLS policies: organizations_insert
-- allows any authenticated user to create an organization row (there's no
-- membership yet to check against), but organization_members_write requires
-- the caller to already be studio_owner of that org — which is impossible
-- for the very first membership row. Plain client-side inserts can never
-- satisfy both policies in sequence.
--
-- This SECURITY DEFINER function performs both inserts atomically, scoped
-- entirely to auth.uid() internally (never trusts a caller-supplied user
-- id), and is exposed as a public RPC so the Next.js auth callback route
-- can call it as the signed-in user right after email confirmation.

create or replace function public.create_organization_with_owner(org_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org_id uuid;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'create_organization_with_owner requires an authenticated user';
  end if;

  -- Idempotent: if this user already belongs to an organization, do not
  -- create a second one (the auth callback route only calls this once per
  -- user, but the RPC itself must not assume that).
  select organization_id into v_org_id
  from public.organization_members
  where user_id = v_user_id
  limit 1;

  if v_org_id is not null then
    return v_org_id;
  end if;

  insert into public.organizations (name)
  values (coalesce(trim(org_name), 'My Studio'))
  returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role, accepted_at)
  values (v_org_id, v_user_id, 'studio_owner', now());

  insert into public.organization_settings (organization_id)
  values (v_org_id);

  return v_org_id;
end;
$$;

grant execute on function public.create_organization_with_owner(text) to authenticated;
