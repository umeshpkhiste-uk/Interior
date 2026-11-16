-- Client-Lead CRM Kit: leads, their follow-ups, and the quotations sent
-- against them, modelled after Client-Lead-CRM-Kit.xlsx (sheets: Leads,
-- Follow-ups, Quotations Sent). Dashboard stats (sheet: Lead Dashboard) are
-- computed in the app layer from these tables, same as src/lib/data/dashboard.ts
-- does for the main dashboard — no SQL views needed.

create type public.lead_source as enum (
  'referral', 'social_media', 'website', 'past_client', 'builder_tie_up',
  'signboard', 'exhibition', 'walk_in', 'other'
);

create type public.lead_stage as enum (
  'new', 'site_visit_done', 'design_shared', 'quotation_sent', 'negotiation',
  'won', 'lost'
);

create type public.lead_followup_channel as enum (
  'call', 'site_visit', 'studio_meeting', 'message', 'email', 'other'
);

create type public.lead_quotation_status as enum (
  'sent', 'revised', 'accepted', 'declined', 'superseded'
);

-- Atomic per-organization counters for lead codes and quotation numbers,
-- same pattern as organizations.next_project_seq / allocate_project_code.
alter table public.organizations
  add column next_lead_seq int not null default 1,
  add column next_lead_quote_seq int not null default 1;

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_code text not null,
  enquiry_date date not null default current_date,
  client_name text not null,
  phone text,
  area text,
  source public.lead_source not null default 'other',
  property_type text,
  budget numeric(14,2) check (budget >= 0),
  stage public.lead_stage not null default 'new',
  next_followup_date date,
  custom_1 text,
  custom_2 text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, lead_code)
);
create trigger trg_leads_updated_at before update on public.leads
  for each row execute function app.set_updated_at();
create index idx_leads_org_stage on public.leads(organization_id, stage);

create table public.lead_followups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  followup_date date not null default current_date,
  channel public.lead_followup_channel not null default 'call',
  handled_by text,
  outcome text,
  stage_snapshot public.lead_stage,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_lead_followups_updated_at before update on public.lead_followups
  for each row execute function app.set_updated_at();
create trigger trg_lead_followups_org before insert on public.lead_followups
  for each row execute function app.set_org_from_parent('leads', 'lead_id');
create index idx_lead_followups_org on public.lead_followups(organization_id);
create index idx_lead_followups_lead on public.lead_followups(lead_id);

create table public.lead_quotations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  quote_number text not null,
  quote_date date not null default current_date,
  quoted_amount numeric(14,2) not null check (quoted_amount >= 0),
  discount_pct numeric(6,4) not null default 0 check (discount_pct >= 0 and discount_pct <= 1),
  final_amount numeric(14,2) generated always as (round(quoted_amount * (1 - discount_pct), 2)) stored,
  status public.lead_quotation_status not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, quote_number)
);
create trigger trg_lead_quotations_updated_at before update on public.lead_quotations
  for each row execute function app.set_updated_at();
create trigger trg_lead_quotations_org before insert on public.lead_quotations
  for each row execute function app.set_org_from_parent('leads', 'lead_id');
create index idx_lead_quotations_org on public.lead_quotations(organization_id);
create index idx_lead_quotations_lead on public.lead_quotations(lead_id);

-- RLS: leads are worked day-to-day by designers as much as studio
-- owners/managers, unlike clients/projects which only owners/managers edit —
-- so designer gets write access here, matching the inspiration library's
-- policy shape (DATABASE_SCHEMA.md leaves no explicit matrix row for this
-- new module; this mirrors the closest existing one).
alter table public.leads enable row level security;
create policy leads_select on public.leads
  for select using (app.is_org_member(organization_id));
create policy leads_write on public.leads
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

alter table public.lead_followups enable row level security;
create policy lead_followups_select on public.lead_followups
  for select using (app.is_org_member(organization_id));
create policy lead_followups_write on public.lead_followups
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

alter table public.lead_quotations enable row level security;
create policy lead_quotations_select on public.lead_quotations
  for select using (app.is_org_member(organization_id));
create policy lead_quotations_write on public.lead_quotations
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

-- Allocators, same shape as allocate_project_code.
create or replace function public.allocate_lead_code(p_org_id uuid)
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
  set next_lead_seq = next_lead_seq + 1
  where id = p_org_id
  returning next_lead_seq - 1 into v_seq;

  if v_seq is null then
    raise exception 'organization % not found', p_org_id;
  end if;

  return 'LD-' || lpad(v_seq::text, 3, '0');
end;
$$;
grant execute on function public.allocate_lead_code(uuid) to authenticated;

create or replace function public.allocate_lead_quote_number(p_org_id uuid)
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
  set next_lead_quote_seq = next_lead_quote_seq + 1
  where id = p_org_id
  returning next_lead_quote_seq - 1 into v_seq;

  if v_seq is null then
    raise exception 'organization % not found', p_org_id;
  end if;

  return 'QT-' || lpad(v_seq::text, 3, '0');
end;
$$;
grant execute on function public.allocate_lead_quote_number(uuid) to authenticated;
