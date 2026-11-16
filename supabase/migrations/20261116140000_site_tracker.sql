-- Project & Site Tracker Kit: stage tasks and site visits, modelled after
-- Project-Site-Tracker-Kit.xlsx. The source workbook's own "Projects"
-- sheet (client, site, scope, value, stage, progress) is NOT reimplemented
-- here — this app already has a richer public.projects (client_id,
-- property details, status, BOQ, quotations) that is that same registry;
-- duplicating it as a second "projects" list would just be the sidebar/tab
-- duplication problem again, one level deeper. Tasks and visits reference
-- the existing projects table instead, and progress/stage/work-in-hand are
-- computed from them plus the existing BOQ/quotation data in the app
-- layer, same as every other kit's dashboard.

create table public.stage_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  stage text not null,
  task text not null,
  done_by text,
  planned_date date,
  done_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_stage_tasks_updated_at before update on public.stage_tasks
  for each row execute function app.set_updated_at();
create index idx_stage_tasks_org_project on public.stage_tasks(organization_id, project_id);

create table public.site_visits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  visit_date date not null default current_date,
  visited_by text,
  purpose text,
  work_done_pct numeric(5,4) check (work_done_pct >= 0 and work_done_pct <= 1),
  notes text,
  next_visit_in_days int check (next_visit_in_days >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_site_visits_updated_at before update on public.site_visits
  for each row execute function app.set_updated_at();
create index idx_site_visits_org_project on public.site_visits(organization_id, project_id);

alter table public.stage_tasks enable row level security;
create policy stage_tasks_select on public.stage_tasks
  for select using (app.is_org_member(organization_id));
create policy stage_tasks_write on public.stage_tasks
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

alter table public.site_visits enable row level security;
create policy site_visits_select on public.site_visits
  for select using (app.is_org_member(organization_id));
create policy site_visits_write on public.site_visits
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));
