create type public.kitchen_layout_type as enum (
  'straight', 'l_shaped', 'u_shaped', 'parallel', 'island'
);
create type public.shutter_type as enum ('hinged', 'sliding', 'open');
create type public.wardrobe_component_type as enum (
  'drawer', 'hanging_rod', 'shelf', 'pull_out', 'mirror', 'other'
);

create table public.kitchen_estimations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  layout_type public.kitchen_layout_type not null default 'straight',
  base_rft numeric(10,2) not null default 0 check (base_rft >= 0),
  wall_rft numeric(10,2) not null default 0 check (wall_rft >= 0),
  tall_qty smallint not null default 0 check (tall_qty >= 0),
  corner_qty smallint not null default 0 check (corner_qty >= 0),
  base_rate numeric(12,2) not null default 0 check (base_rate >= 0),
  wall_rate numeric(12,2) not null default 0 check (wall_rate >= 0),
  tall_rate numeric(12,2) not null default 0 check (tall_rate >= 0),
  corner_rate numeric(12,2) not null default 0 check (corner_rate >= 0),
  countertop_area numeric(10,2) not null default 0 check (countertop_area >= 0),
  countertop_rate numeric(12,2) not null default 0 check (countertop_rate >= 0),
  install_labour_pct numeric(6,4) not null default 0 check (install_labour_pct >= 0),
  wastage_pct numeric(6,4) not null default 0 check (wastage_pct >= 0),
  margin_pct numeric(6,4) not null default 0 check (margin_pct >= 0),
  rounding_unit numeric(10,2) not null default 1000 check (rounding_unit > 0),
  material_cost numeric(14,2) not null default 0,
  labour_cost numeric(14,2) not null default 0,
  total_cost numeric(14,2) not null default 0,
  selling_price numeric(14,2) not null default 0,
  rate_snapshot jsonb,
  calc_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_kitchen_estimations_updated_at before update on public.kitchen_estimations
  for each row execute function app.set_updated_at();
create trigger trg_kitchen_estimations_org before insert on public.kitchen_estimations
  for each row execute function app.set_org_from_parent('projects', 'project_id');
create index idx_kitchen_estimations_project on public.kitchen_estimations(project_id);

create table public.kitchen_accessories (
  id uuid primary key default gen_random_uuid(),
  kitchen_estimation_id uuid not null references public.kitchen_estimations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  qty numeric(10,2) not null default 0 check (qty >= 0),
  rate numeric(12,2) not null default 0 check (rate >= 0),
  amount numeric(14,2) not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_kitchen_accessories_updated_at before update on public.kitchen_accessories
  for each row execute function app.set_updated_at();
create trigger trg_kitchen_accessories_org before insert on public.kitchen_accessories
  for each row execute function app.set_org_from_parent('kitchen_estimations', 'kitchen_estimation_id');
create index idx_kitchen_accessories_estimation on public.kitchen_accessories(kitchen_estimation_id);

-- Every wardrobe gets its own itemized components list (mapping doc
-- decision #4) — not just the first one, as the source workbook did.
create table public.wardrobes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.project_rooms(id) on delete set null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  width numeric(8,2) check (width >= 0),
  height numeric(8,2) check (height >= 0),
  depth numeric(8,2) check (depth >= 0),
  shutter_type public.shutter_type not null default 'hinged',
  has_loft boolean not null default false,
  loft_height numeric(8,2) not null default 0 check (loft_height >= 0),
  hinged_rate numeric(12,2) not null default 0 check (hinged_rate >= 0),
  sliding_rate numeric(12,2) not null default 0 check (sliding_rate >= 0),
  loft_rate numeric(12,2) not null default 0 check (loft_rate >= 0),
  install_labour_pct numeric(6,4) not null default 0 check (install_labour_pct >= 0),
  margin_pct numeric(6,4) not null default 0 check (margin_pct >= 0),
  rounding_unit numeric(10,2) not null default 500 check (rounding_unit > 0),
  material_cost numeric(14,2) not null default 0,
  total_cost numeric(14,2) not null default 0,
  selling_price numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_wardrobes_updated_at before update on public.wardrobes
  for each row execute function app.set_updated_at();
create trigger trg_wardrobes_org before insert on public.wardrobes
  for each row execute function app.set_org_from_parent('projects', 'project_id');
create index idx_wardrobes_project on public.wardrobes(project_id);
create index idx_wardrobes_room on public.wardrobes(room_id);

create table public.wardrobe_components (
  id uuid primary key default gen_random_uuid(),
  wardrobe_id uuid not null references public.wardrobes(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  component_name public.wardrobe_component_type not null default 'other',
  qty numeric(10,2) not null default 0 check (qty >= 0),
  rate numeric(12,2) not null default 0 check (rate >= 0),
  amount numeric(14,2) not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_wardrobe_components_updated_at before update on public.wardrobe_components
  for each row execute function app.set_updated_at();
create trigger trg_wardrobe_components_org before insert on public.wardrobe_components
  for each row execute function app.set_org_from_parent('wardrobes', 'wardrobe_id');
create index idx_wardrobe_components_wardrobe on public.wardrobe_components(wardrobe_id);
