-- Project Profit & Billing Kit: client invoices, modelled after
-- Project-Profit-Billing-Kit.xlsx. The source workbook's "Projects" sheet
-- (contract value, billed, costs, profit) is NOT a new table -- it is this
-- app's existing public.projects plus the quotation already approved for
-- it (contract value) and the existing public.project_expenses /
-- public.project_payments (costs and receipts), all just rolled up. The
-- "Project Costs" sheet is public.project_expenses as-is: its categories
-- (boards/hardware/labour/ceiling/paint/transport) already map onto the
-- app's material_purchase/labour_payment/transportation/site_expense/misc.
-- The "Receipts" sheet is public.project_payments as-is -- it already has
-- amount/date/method/reference -- it only gains an optional link to the
-- one genuinely new thing this kit needs: formal, GST, due-dated invoices.

alter table public.organizations
  add column next_invoice_seq int not null default 1;

create table public.client_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  invoice_number text not null,
  invoice_date date not null default current_date,
  milestone text not null,
  amount numeric(14,2) not null check (amount >= 0),
  gst_pct numeric(5,4) not null default 0.18 check (gst_pct >= 0 and gst_pct <= 1),
  total numeric(14,2) generated always as (round(amount * (1 + gst_pct), 2)) stored,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, invoice_number)
);
create trigger trg_client_invoices_updated_at before update on public.client_invoices
  for each row execute function app.set_updated_at();
create index idx_client_invoices_org_project on public.client_invoices(organization_id, project_id);

alter table public.project_payments
  add column invoice_id uuid references public.client_invoices(id) on delete set null;
create index idx_project_payments_invoice on public.project_payments(invoice_id);

alter table public.client_invoices enable row level security;
create policy client_invoices_select on public.client_invoices
  for select using (app.is_org_member(organization_id));
create policy client_invoices_write on public.client_invoices
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[]));

create or replace function public.allocate_invoice_number(p_org_id uuid)
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
  set next_invoice_seq = next_invoice_seq + 1
  where id = p_org_id
  returning next_invoice_seq - 1 into v_seq;

  if v_seq is null then
    raise exception 'organization % not found', p_org_id;
  end if;

  return 'INV-' || lpad(v_seq::text, 3, '0');
end;
$$;
grant execute on function public.allocate_invoice_number(uuid) to authenticated;
