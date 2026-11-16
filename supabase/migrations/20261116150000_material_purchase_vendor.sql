-- Material Purchase & Vendor Kit: purchase orders, material issued to site,
-- and vendor payments, modelled after Material-Purchase-Vendor-Kit.xlsx.
-- The source workbook's own "Vendors" sheet is NOT a new table — this app
-- already has public.suppliers (used by the Material Library's rate
-- sourcing), which is the same entity; it just gains the two extra fields
-- (category, credit days) this kit's vendor view needs, plus a short
-- human-readable code, same allocator pattern as every other kit's codes.

alter table public.organizations
  add column next_vendor_seq int not null default 1,
  add column next_purchase_order_seq int not null default 1;

alter table public.suppliers
  add column vendor_code text,
  add column category text,
  add column credit_days int not null default 0 check (credit_days >= 0);
create unique index idx_suppliers_org_vendor_code on public.suppliers(organization_id, vendor_code) where vendor_code is not null;

create type public.purchase_delivery_status as enum ('pending', 'delivered');

create type public.vendor_payment_mode as enum ('cash', 'upi', 'bank_transfer', 'cheque', 'other');

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  po_number text not null,
  vendor_id uuid not null references public.suppliers(id) on delete restrict,
  project_id uuid references public.projects(id) on delete set null,
  order_date date not null default current_date,
  item text not null,
  unit text not null,
  qty numeric(12,2) not null check (qty > 0),
  rate numeric(12,2) not null check (rate >= 0),
  gst_pct numeric(5,4) not null default 0 check (gst_pct >= 0 and gst_pct <= 1),
  amount numeric(14,2) generated always as (round(qty * rate * (1 + gst_pct), 2)) stored,
  delivery_status public.purchase_delivery_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, po_number)
);
create trigger trg_purchase_orders_updated_at before update on public.purchase_orders
  for each row execute function app.set_updated_at();
create index idx_purchase_orders_org_vendor on public.purchase_orders(organization_id, vendor_id);
create index idx_purchase_orders_org_project on public.purchase_orders(organization_id, project_id);

create table public.material_issues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  issue_date date not null default current_date,
  item text not null,
  unit text not null,
  qty numeric(12,2) not null check (qty > 0),
  rate numeric(12,2) not null check (rate >= 0),
  value numeric(14,2) generated always as (round(qty * rate, 2)) stored,
  issued_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_material_issues_updated_at before update on public.material_issues
  for each row execute function app.set_updated_at();
create index idx_material_issues_org_project on public.material_issues(organization_id, project_id);
create index idx_material_issues_po on public.material_issues(purchase_order_id);

create table public.vendor_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vendor_id uuid not null references public.suppliers(id) on delete restrict,
  payment_date date not null default current_date,
  amount numeric(14,2) not null check (amount > 0),
  mode public.vendor_payment_mode not null default 'bank_transfer',
  reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_vendor_payments_updated_at before update on public.vendor_payments
  for each row execute function app.set_updated_at();
create index idx_vendor_payments_org_vendor on public.vendor_payments(organization_id, vendor_id);

-- RLS: purchase orders and vendor payments are money matters (studio
-- owner/manager/accountant, matching project_expenses/payments); material
-- issue is site logistics, so designer gets write access too.
alter table public.purchase_orders enable row level security;
create policy purchase_orders_select on public.purchase_orders
  for select using (app.is_org_member(organization_id));
create policy purchase_orders_write on public.purchase_orders
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[]));

alter table public.material_issues enable row level security;
create policy material_issues_select on public.material_issues
  for select using (app.is_org_member(organization_id));
create policy material_issues_write on public.material_issues
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

alter table public.vendor_payments enable row level security;
create policy vendor_payments_select on public.vendor_payments
  for select using (app.is_org_member(organization_id));
create policy vendor_payments_write on public.vendor_payments
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[]));

-- Allocators, same shape as allocate_lead_code.
create or replace function public.allocate_vendor_code(p_org_id uuid)
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
  set next_vendor_seq = next_vendor_seq + 1
  where id = p_org_id
  returning next_vendor_seq - 1 into v_seq;

  if v_seq is null then
    raise exception 'organization % not found', p_org_id;
  end if;

  return 'VN-' || lpad(v_seq::text, 2, '0');
end;
$$;
grant execute on function public.allocate_vendor_code(uuid) to authenticated;

create or replace function public.allocate_purchase_order_number(p_org_id uuid)
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
  set next_purchase_order_seq = next_purchase_order_seq + 1
  where id = p_org_id
  returning next_purchase_order_seq - 1 into v_seq;

  if v_seq is null then
    raise exception 'organization % not found', p_org_id;
  end if;

  return 'PO-' || lpad(v_seq::text, 3, '0');
end;
$$;
grant execute on function public.allocate_purchase_order_number(uuid) to authenticated;
