-- Design Approval & Handover Kit: design revisions, client sign-offs, snags,
-- the handover walk checklist, and the warranty register, modelled after
-- Design-Approval-Handover-Kit.xlsx. Every row belongs to an existing
-- project (unlike the Client-Lead kit, these happen on projects that
-- already exist in this app), so project_id references public.projects
-- instead of a free-text project code. Dashboard stats are computed in the
-- app layer, same as the other kits.

create type public.design_revision_reply_status as enum (
  'waiting', 'approved', 'changes_requested'
);

create type public.client_approval_channel as enum (
  'signed_drawing', 'message', 'email', 'in_person', 'other'
);

create type public.handover_check_result as enum (
  'ok', 'needs_work'
);

alter table public.organizations
  add column next_design_revision_seq int not null default 1,
  add column next_snag_seq int not null default 1;

create table public.design_revisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  revision_code text not null,
  room_area text,
  drawing text not null,
  version text not null default 'R1',
  client_asked_for text,
  sent_on date not null default current_date,
  reply_on date,
  reply_status public.design_revision_reply_status not null default 'waiting',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, revision_code)
);
create trigger trg_design_revisions_updated_at before update on public.design_revisions
  for each row execute function app.set_updated_at();
create index idx_design_revisions_org_project on public.design_revisions(organization_id, project_id);

create table public.client_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  approval_for text not null,
  room_area text,
  sent_on date not null default current_date,
  approved_on date,
  approved_by text,
  channel public.client_approval_channel,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_client_approvals_updated_at before update on public.client_approvals
  for each row execute function app.set_updated_at();
create index idx_client_approvals_org_project on public.client_approvals(organization_id, project_id);

create table public.snags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  snag_code text not null,
  room_area text,
  item text not null,
  issue text not null,
  found_on date not null default current_date,
  assigned_to text,
  fix_by date,
  fixed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, snag_code)
);
create trigger trg_snags_updated_at before update on public.snags
  for each row execute function app.set_updated_at();
create index idx_snags_org_project on public.snags(organization_id, project_id);

create table public.handover_checks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  room_area text,
  check_item text not null,
  checked_by text,
  checked_on date,
  result public.handover_check_result,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_handover_checks_updated_at before update on public.handover_checks
  for each row execute function app.set_updated_at();
create index idx_handover_checks_org_project on public.handover_checks(organization_id, project_id);

create table public.warranties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  item text not null,
  handover_date date not null default current_date,
  warranty_years numeric(4,1) not null check (warranty_years > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_warranties_updated_at before update on public.warranties
  for each row execute function app.set_updated_at();
create index idx_warranties_org_project on public.warranties(organization_id, project_id);

-- RLS: same shape as the Client-Lead kit — designers work these day-to-day,
-- alongside studio owners/managers.
alter table public.design_revisions enable row level security;
create policy design_revisions_select on public.design_revisions
  for select using (app.is_org_member(organization_id));
create policy design_revisions_write on public.design_revisions
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

alter table public.client_approvals enable row level security;
create policy client_approvals_select on public.client_approvals
  for select using (app.is_org_member(organization_id));
create policy client_approvals_write on public.client_approvals
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

alter table public.snags enable row level security;
create policy snags_select on public.snags
  for select using (app.is_org_member(organization_id));
create policy snags_write on public.snags
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

alter table public.handover_checks enable row level security;
create policy handover_checks_select on public.handover_checks
  for select using (app.is_org_member(organization_id));
create policy handover_checks_write on public.handover_checks
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

alter table public.warranties enable row level security;
create policy warranties_select on public.warranties
  for select using (app.is_org_member(organization_id));
create policy warranties_write on public.warranties
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

-- Allocators, same shape as allocate_lead_code.
create or replace function public.allocate_design_revision_code(p_org_id uuid)
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
  set next_design_revision_seq = next_design_revision_seq + 1
  where id = p_org_id
  returning next_design_revision_seq - 1 into v_seq;

  if v_seq is null then
    raise exception 'organization % not found', p_org_id;
  end if;

  return 'REV-' || lpad(v_seq::text, 3, '0');
end;
$$;
grant execute on function public.allocate_design_revision_code(uuid) to authenticated;

create or replace function public.allocate_snag_code(p_org_id uuid)
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
  set next_snag_seq = next_snag_seq + 1
  where id = p_org_id
  returning next_snag_seq - 1 into v_seq;

  if v_seq is null then
    raise exception 'organization % not found', p_org_id;
  end if;

  return 'SN-' || lpad(v_seq::text, 3, '0');
end;
$$;
grant execute on function public.allocate_snag_code(uuid) to authenticated;
