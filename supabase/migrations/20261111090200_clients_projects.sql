create type public.property_type as enum (
  'apartment', 'villa', 'independent_house', 'office', 'commercial'
);

create type public.project_status as enum (
  'enquiry', 'site_visit', 'measurements_pending', 'design_in_progress',
  'estimation_in_progress', 'quotation_sent', 'approved', 'execution_started',
  'completed', 'cancelled'
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  mobile text,
  email text,
  alternate_contact text,
  address text,
  city text,
  state text,
  pin_code text,
  property_type public.property_type,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_clients_updated_at before update on public.clients
  for each row execute function app.set_updated_at();
create index idx_clients_org on public.clients(organization_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  project_code text not null,
  name text not null,
  property_address text,
  property_type public.property_type,
  bedrooms smallint check (bedrooms >= 0),
  bathrooms smallint check (bathrooms >= 0),
  carpet_area numeric(10,2) check (carpet_area >= 0),
  built_up_area numeric(10,2) check (built_up_area >= 0),
  start_date date,
  expected_completion_date date,
  status public.project_status not null default 'enquiry',
  description text,
  assigned_designer_id uuid references public.profiles(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, project_code)
);
create trigger trg_projects_updated_at before update on public.projects
  for each row execute function app.set_updated_at();
create index idx_projects_org_status on public.projects(organization_id, status);
create index idx_projects_client on public.projects(client_id);
