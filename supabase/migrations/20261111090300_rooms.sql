create type public.room_category as enum (
  'living_room', 'dining_room', 'master_bedroom', 'bedroom_2', 'bedroom_3',
  'kitchen', 'bathroom', 'balcony', 'utility', 'passage', 'other'
);
create type public.unit_system as enum ('feet_inches', 'metric');
create type public.opening_type as enum ('door', 'window', 'other');

create table public.project_rooms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  room_name text not null,
  room_category public.room_category not null default 'other',
  length numeric(10,3) check (length >= 0),
  width numeric(10,3) check (width >= 0),
  height numeric(10,3) check (height >= 0),
  unit_system public.unit_system not null default 'feet_inches',
  length_ft numeric(10,3) check (length_ft >= 0),
  width_ft numeric(10,3) check (width_ft >= 0),
  height_ft numeric(10,3) check (height_ft >= 0),
  floor_area numeric(10,2) check (floor_area >= 0),
  gross_wall_area numeric(10,2) check (gross_wall_area >= 0),
  net_wall_area numeric(10,2) check (net_wall_area >= 0),
  ceiling_area numeric(10,2) check (ceiling_area >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_project_rooms_updated_at before update on public.project_rooms
  for each row execute function app.set_updated_at();
create trigger trg_project_rooms_org before insert on public.project_rooms
  for each row execute function app.set_org_from_parent('projects', 'project_id');
create index idx_project_rooms_project on public.project_rooms(project_id);
create index idx_project_rooms_org on public.project_rooms(organization_id);

create table public.room_openings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.project_rooms(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opening_type public.opening_type not null default 'door',
  width numeric(8,3) check (width >= 0),
  height numeric(8,3) check (height >= 0),
  quantity smallint not null default 1 check (quantity >= 0),
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_room_openings_updated_at before update on public.room_openings
  for each row execute function app.set_updated_at();
create trigger trg_room_openings_org before insert on public.room_openings
  for each row execute function app.set_org_from_parent('project_rooms', 'room_id');
create index idx_room_openings_room on public.room_openings(room_id);
create index idx_room_openings_org on public.room_openings(organization_id);

create table public.room_measurement_audit (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.project_rooms(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  field_name text not null,
  old_value text,
  new_value text,
  changed_at timestamptz not null default now()
);
create trigger trg_room_measurement_audit_org before insert on public.room_measurement_audit
  for each row execute function app.set_org_from_parent('project_rooms', 'room_id');
create index idx_room_measurement_audit_room on public.room_measurement_audit(room_id, changed_at desc);
