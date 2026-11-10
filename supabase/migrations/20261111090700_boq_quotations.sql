create type public.boq_source_module as enum (
  'kitchen', 'wardrobe', 'plywood', 'ceiling', 'paint', 'flooring', 'electrical'
);
create type public.quotation_status as enum ('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired');
create type public.discount_type as enum ('percent', 'fixed');

create table public.boq_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  room_id uuid references public.project_rooms(id) on delete set null,
  serial_no int,
  work_category text,
  item_description text not null,
  specification text,
  brand text,
  unit text,
  quantity numeric(12,3) not null default 0 check (quantity >= 0),
  material_rate numeric(12,2) not null default 0 check (material_rate >= 0),
  labour_rate numeric(12,2) not null default 0 check (labour_rate >= 0),
  total_rate numeric(12,2) not null default 0 check (total_rate >= 0),
  amount numeric(14,2) not null default 0 check (amount >= 0),
  is_manual boolean not null default true,
  source_module public.boq_source_module,
  source_estimation_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_boq_items_updated_at before update on public.boq_items
  for each row execute function app.set_updated_at();
create trigger trg_boq_items_org before insert on public.boq_items
  for each row execute function app.set_org_from_parent('projects', 'project_id');
create index idx_boq_items_project on public.boq_items(project_id);
-- Makes "sync from estimators" idempotent: re-running sync upserts on this
-- key instead of duplicating rows (mapping doc decision #7, replacing the
-- source workbook's fragile ordinal-position wardrobe linking).
create unique index uq_boq_items_sync on public.boq_items(project_id, source_module, source_estimation_id)
  where source_module is not null;

create table public.project_boq_settings (
  project_id uuid primary key references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contingency_pct numeric(6,4) not null default 0.0500 check (contingency_pct >= 0),
  gst_pct numeric(6,4) not null default 0.1800 check (gst_pct >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_project_boq_settings_updated_at before update on public.project_boq_settings
  for each row execute function app.set_updated_at();
create trigger trg_project_boq_settings_org before insert on public.project_boq_settings
  for each row execute function app.set_org_from_parent('projects', 'project_id');

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  -- organization_id is not listed under the "quotations" bullet in
  -- DATABASE_SCHEMA.md but IS required by its own "Indexes" section
  -- (quotations(organization_id, quotation_number) unique) and RLS
  -- strategy section — added here to make both of those correct.
  organization_id uuid not null references public.organizations(id) on delete cascade,
  quotation_number text not null,
  status public.quotation_status not null default 'draft',
  quotation_date date not null default current_date,
  validity_date date,
  discount_type public.discount_type not null default 'percent',
  discount_value numeric(12,2) not null default 0 check (discount_value >= 0),
  gst_pct numeric(6,4) not null default 0.1800 check (gst_pct >= 0),
  subtotal numeric(14,2) not null default 0,
  contingency_amount numeric(14,2) not null default 0,
  gross_amount numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  taxable_amount numeric(14,2) not null default 0,
  gst_amount numeric(14,2) not null default 0,
  round_off numeric(8,2) not null default 0,
  grand_total numeric(14,2) not null default 0,
  version int not null default 1 check (version >= 1),
  parent_quotation_id uuid references public.quotations(id) on delete set null,
  sent_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, quotation_number)
);
create trigger trg_quotations_updated_at before update on public.quotations
  for each row execute function app.set_updated_at();
create trigger trg_quotations_org before insert on public.quotations
  for each row execute function app.set_org_from_parent('projects', 'project_id');
create index idx_quotations_project on public.quotations(project_id);

create table public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  room_label text,
  item_description text not null,
  specification text,
  unit text,
  quantity numeric(12,3) not null default 0 check (quantity >= 0),
  rate numeric(12,2) not null default 0 check (rate >= 0),
  amount numeric(14,2) not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_quotation_items_updated_at before update on public.quotation_items
  for each row execute function app.set_updated_at();
create trigger trg_quotation_items_org before insert on public.quotation_items
  for each row execute function app.set_org_from_parent('quotations', 'quotation_id');
create index idx_quotation_items_quotation on public.quotation_items(quotation_id);

-- Immutable once written (master prompt §21: "previously approved
-- quotations must preserve their original rates ... use immutable
-- quotation snapshots"). No UPDATE/DELETE RLS policy is granted for this
-- table at all (see rls_policies migration); the trigger below is a
-- defense-in-depth backstop against any elevated-privilege write path.
create table public.quotation_snapshots (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create trigger trg_quotation_snapshots_org before insert on public.quotation_snapshots
  for each row execute function app.set_org_from_parent('quotations', 'quotation_id');
create trigger trg_quotation_snapshots_immutable
  before update or delete on public.quotation_snapshots
  for each row execute function app.reject_mutation();
create index idx_quotation_snapshots_quotation on public.quotation_snapshots(quotation_id);

create table public.quotation_payment_stages (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stage_name text not null,
  stage_pct numeric(6,4) check (stage_pct between 0 and 1),
  stage_amount numeric(14,2) not null default 0 check (stage_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_quotation_payment_stages_updated_at before update on public.quotation_payment_stages
  for each row execute function app.set_updated_at();
create trigger trg_quotation_payment_stages_org before insert on public.quotation_payment_stages
  for each row execute function app.set_org_from_parent('quotations', 'quotation_id');
create index idx_quotation_payment_stages_quotation on public.quotation_payment_stages(quotation_id);
