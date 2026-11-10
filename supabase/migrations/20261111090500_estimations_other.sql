create type public.ceiling_type as enum ('gypsum', 'pop', 'grid', 'pvc', 'wooden', 'other');
create type public.ceiling_design as enum ('cove', 'peripheral', 'none');
create type public.flooring_type as enum (
  'vitrified', 'ceramic', 'marble', 'granite', 'wooden', 'vinyl', 'laminate', 'spc', 'no_work'
);
create type public.electrical_point_type as enum (
  'light', 'fan', 'socket_6a', 'socket_16a', 'ac', 'tv', 'data', 'geyser',
  'profile_lighting', 'db_mcb', 'other'
);

create table public.panel_cut_lists (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  panel_length numeric(8,2) check (panel_length >= 0),
  panel_width numeric(8,2) check (panel_width >= 0),
  qty smallint not null default 1 check (qty >= 0),
  board_grade text,
  plywood_thickness text,
  laminate_type text,
  laminate_thickness text,
  laminate_faces smallint not null default 0 check (laminate_faces between 0 and 2),
  has_edge_band boolean not null default false,
  wastage_pct numeric(6,4) not null default 0 check (wastage_pct >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_panel_cut_lists_updated_at before update on public.panel_cut_lists
  for each row execute function app.set_updated_at();
create trigger trg_panel_cut_lists_org before insert on public.panel_cut_lists
  for each row execute function app.set_org_from_parent('projects', 'project_id');
create index idx_panel_cut_lists_project on public.panel_cut_lists(project_id);

create table public.plywood_rates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  board_grade text not null,
  rate_per_sheet numeric(12,2) not null default 0 check (rate_per_sheet >= 0),
  sheet_length numeric(8,2) not null default 8 check (sheet_length > 0),
  sheet_width numeric(8,2) not null default 4 check (sheet_width > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_plywood_rates_updated_at before update on public.plywood_rates
  for each row execute function app.set_updated_at();
create index idx_plywood_rates_org on public.plywood_rates(organization_id);

create table public.ceiling_estimations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.project_rooms(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  ceiling_type public.ceiling_type not null default 'gypsum',
  cover_pct numeric(6,4) not null default 1 check (cover_pct between 0 and 1),
  design public.ceiling_design not null default 'none',
  cove_length numeric(10,2) not null default 0 check (cove_length >= 0),
  led_strip_length numeric(10,2) not null default 0 check (led_strip_length >= 0),
  downlight_qty smallint not null default 0 check (downlight_qty >= 0),
  material_rate numeric(12,2) not null default 0 check (material_rate >= 0),
  labour_rate numeric(12,2) not null default 0 check (labour_rate >= 0),
  board_dimensions text,
  wastage_pct numeric(6,4) not null default 0 check (wastage_pct >= 0),
  lighting_rate numeric(12,2) not null default 0 check (lighting_rate >= 0),
  margin_pct numeric(6,4) not null default 0 check (margin_pct >= 0),
  rounding_unit numeric(10,2) not null default 500 check (rounding_unit > 0),
  material_cost numeric(14,2) not null default 0,
  labour_cost numeric(14,2) not null default 0,
  total_cost numeric(14,2) not null default 0,
  selling_price numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_ceiling_estimations_updated_at before update on public.ceiling_estimations
  for each row execute function app.set_updated_at();
create trigger trg_ceiling_estimations_org before insert on public.ceiling_estimations
  for each row execute function app.set_org_from_parent('project_rooms', 'room_id');
create index idx_ceiling_estimations_room on public.ceiling_estimations(room_id);

create table public.paint_estimations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.project_rooms(id) on delete set null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  net_wall_area numeric(10,2) not null default 0 check (net_wall_area >= 0),
  ceiling_area numeric(10,2) not null default 0 check (ceiling_area >= 0),
  feature_wall_area numeric(10,2) not null default 0 check (feature_wall_area >= 0),
  coats smallint not null default 2 check (coats >= 0),
  paint_coverage_per_litre numeric(8,2) check (paint_coverage_per_litre >= 0),
  primer_coverage numeric(8,2) check (primer_coverage >= 0),
  putty_coverage numeric(8,2) check (putty_coverage >= 0),
  can_size numeric(6,2) check (can_size >= 0),
  paint_rate numeric(12,2) check (paint_rate >= 0),
  primer_rate numeric(12,2) check (primer_rate >= 0),
  putty_rate numeric(12,2) check (putty_rate >= 0),
  labour_rate numeric(12,2) check (labour_rate >= 0),
  wallpaper_roll_length numeric(8,2) check (wallpaper_roll_length >= 0),
  wallpaper_roll_width numeric(8,2) check (wallpaper_roll_width >= 0),
  wallpaper_rate numeric(12,2) check (wallpaper_rate >= 0),
  wastage_pct numeric(6,4) not null default 0 check (wastage_pct >= 0),
  paint_brand text,
  finish_type text,
  material_cost numeric(14,2) not null default 0,
  labour_cost numeric(14,2) not null default 0,
  total_cost numeric(14,2) not null default 0,
  selling_price numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_paint_estimations_updated_at before update on public.paint_estimations
  for each row execute function app.set_updated_at();
create trigger trg_paint_estimations_org before insert on public.paint_estimations
  for each row execute function app.set_org_from_parent('projects', 'project_id');
create index idx_paint_estimations_project on public.paint_estimations(project_id);

create table public.flooring_estimations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.project_rooms(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  flooring_type public.flooring_type not null default 'vitrified',
  tile_length numeric(8,2) check (tile_length >= 0),
  tile_width numeric(8,2) check (tile_width >= 0),
  price_per_box numeric(12,2) check (price_per_box >= 0),
  pieces_per_box smallint check (pieces_per_box >= 0),
  wastage_pct numeric(6,4) not null default 0 check (wastage_pct >= 0),
  laying_labour_rate numeric(12,2) check (laying_labour_rate >= 0),
  adhesive_grout_rate numeric(12,2) check (adhesive_grout_rate >= 0),
  skirting_length numeric(10,2) not null default 0 check (skirting_length >= 0),
  skirting_rate numeric(12,2) not null default 0 check (skirting_rate >= 0),
  material_cost numeric(14,2) not null default 0,
  labour_cost numeric(14,2) not null default 0,
  total_cost numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_flooring_estimations_updated_at before update on public.flooring_estimations
  for each row execute function app.set_updated_at();
create trigger trg_flooring_estimations_org before insert on public.flooring_estimations
  for each row execute function app.set_org_from_parent('project_rooms', 'room_id');
create index idx_flooring_estimations_room on public.flooring_estimations(room_id);

create table public.electrical_estimations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.project_rooms(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  point_type public.electrical_point_type not null,
  qty numeric(10,2) not null default 0 check (qty >= 0),
  all_in_rate numeric(12,2) not null default 0 check (all_in_rate >= 0),
  wiring_spec text,
  amount numeric(14,2) not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_electrical_estimations_updated_at before update on public.electrical_estimations
  for each row execute function app.set_updated_at();
create trigger trg_electrical_estimations_org before insert on public.electrical_estimations
  for each row execute function app.set_org_from_parent('project_rooms', 'room_id');
create index idx_electrical_estimations_room on public.electrical_estimations(room_id);

-- One row per project: the "labour share in all-in point rates" convention
-- (mapping doc decision #6) and the lump-sum DB/MCB cost.
create table public.electrical_project_settings (
  project_id uuid primary key references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  db_mcb_cost numeric(14,2) not null default 0 check (db_mcb_cost >= 0),
  labour_share_pct numeric(6,4) not null default 0.3500 check (labour_share_pct between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_electrical_project_settings_updated_at before update on public.electrical_project_settings
  for each row execute function app.set_updated_at();
create trigger trg_electrical_project_settings_org before insert on public.electrical_project_settings
  for each row execute function app.set_org_from_parent('projects', 'project_id');
