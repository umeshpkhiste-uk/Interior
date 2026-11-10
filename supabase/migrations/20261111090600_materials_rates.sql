create table public.material_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  parent_category_id uuid references public.material_categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_material_categories_updated_at before update on public.material_categories
  for each row execute function app.set_updated_at();
create index idx_material_categories_org on public.material_categories(organization_id);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.material_categories(id) on delete set null,
  name text not null,
  unit text not null,
  description text,
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_materials_updated_at before update on public.materials
  for each row execute function app.set_updated_at();
create index idx_materials_org on public.materials(organization_id);
create index idx_materials_category on public.materials(category_id);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_phone text,
  contact_email text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_suppliers_updated_at before update on public.suppliers
  for each row execute function app.set_updated_at();
create index idx_suppliers_org on public.suppliers(organization_id);

create table public.material_rates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  current_rate numeric(12,2) not null default 0 check (current_rate >= 0),
  previous_rate numeric(12,2) check (previous_rate >= 0),
  revised_rate numeric(12,2) check (revised_rate >= 0),
  effective_date date,
  last_updated_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_material_rates_updated_at before update on public.material_rates
  for each row execute function app.set_updated_at();
create index idx_material_rates_org_material on public.material_rates(organization_id, material_id);

-- Append-only history of every rate change. Changing a rate here must
-- never mutate an already-approved quotation's snapshot (mapping doc
-- decision #9) — this table is purely a log for the Rate Revision module.
create table public.rate_history (
  id uuid primary key default gen_random_uuid(),
  material_rate_id uuid not null references public.material_rates(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  old_rate numeric(12,2),
  new_rate numeric(12,2),
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now(),
  reason text
);
create trigger trg_rate_history_org before insert on public.rate_history
  for each row execute function app.set_org_from_parent('material_rates', 'material_rate_id');
create index idx_rate_history_rate_changed on public.rate_history(material_rate_id, changed_at desc);
