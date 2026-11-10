create type public.design_fee_basis as enum ('percent', 'per_sqft', 'fixed');
create type public.package_tier as enum ('basic', 'premium', 'luxury');
create type public.package_component_type as enum (
  'kitchen', 'wardrobe', 'ceiling', 'flooring', 'painting', 'electrical', 'lighting', 'other'
);

create table public.design_fees (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  basis public.design_fee_basis not null default 'percent',
  fee_pct numeric(6,4) not null default 0 check (fee_pct >= 0),
  fee_per_sqft numeric(12,2) not null default 0 check (fee_per_sqft >= 0),
  fixed_fee numeric(14,2) not null default 0 check (fixed_fee >= 0),
  included_visits smallint not null default 0 check (included_visits >= 0),
  additional_visits smallint not null default 0 check (additional_visits >= 0),
  additional_visit_rate numeric(12,2) not null default 0 check (additional_visit_rate >= 0),
  gst_pct numeric(6,4) not null default 0.1800 check (gst_pct >= 0),
  design_fee_amount numeric(14,2) not null default 0,
  extra_visit_amount numeric(14,2) not null default 0,
  total_before_gst numeric(14,2) not null default 0,
  total_with_gst numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_design_fees_updated_at before update on public.design_fees
  for each row execute function app.set_updated_at();
create trigger trg_design_fees_org before insert on public.design_fees
  for each row execute function app.set_org_from_parent('projects', 'project_id');
create index idx_design_fees_project on public.design_fees(project_id);

create table public.design_fee_stages (
  id uuid primary key default gen_random_uuid(),
  design_fee_id uuid not null references public.design_fees(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stage_name text not null,
  stage_pct numeric(6,4) check (stage_pct between 0 and 1),
  stage_amount numeric(14,2) not null default 0 check (stage_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_design_fee_stages_updated_at before update on public.design_fee_stages
  for each row execute function app.set_updated_at();
create trigger trg_design_fee_stages_org before insert on public.design_fee_stages
  for each row execute function app.set_org_from_parent('design_fees', 'design_fee_id');
create index idx_design_fee_stages_fee on public.design_fee_stages(design_fee_id);

create table public.project_packages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  tier public.package_tier not null,
  round_step numeric(10,2) not null default 5000 check (round_step >= 0),
  is_selected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, tier)
);
create trigger trg_project_packages_updated_at before update on public.project_packages
  for each row execute function app.set_updated_at();
create trigger trg_project_packages_org before insert on public.project_packages
  for each row execute function app.set_org_from_parent('projects', 'project_id');
create index idx_project_packages_project on public.project_packages(project_id);

create table public.package_components (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.project_packages(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  component public.package_component_type not null,
  rate_per_sqft numeric(12,2) not null default 0 check (rate_per_sqft >= 0),
  spec_text text,
  brand_options text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_package_components_updated_at before update on public.package_components
  for each row execute function app.set_updated_at();
create trigger trg_package_components_org before insert on public.package_components
  for each row execute function app.set_org_from_parent('project_packages', 'package_id');
create index idx_package_components_package on public.package_components(package_id);
