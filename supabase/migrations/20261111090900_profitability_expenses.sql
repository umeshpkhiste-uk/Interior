create type public.expense_category as enum (
  'material_purchase', 'labour_payment', 'transportation', 'site_expense', 'misc'
);
create type public.payment_direction as enum (
  'client_advance', 'client_payment', 'supplier_payment'
);

create table public.project_settings (
  project_id uuid primary key references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  overhead_pct numeric(6,4) not null default 0 check (overhead_pct >= 0),
  supervisor_monthly_cost numeric(14,2) not null default 0 check (supervisor_monthly_cost >= 0),
  project_duration_months numeric(6,2) not null default 0 check (project_duration_months >= 0),
  target_margin_pct numeric(6,4) not null default 0.2000 check (target_margin_pct >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_project_settings_updated_at before update on public.project_settings
  for each row execute function app.set_updated_at();
create trigger trg_project_settings_org before insert on public.project_settings
  for each row execute function app.set_org_from_parent('projects', 'project_id');

create table public.project_expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category public.expense_category not null,
  description text,
  amount numeric(14,2) not null default 0 check (amount >= 0),
  expense_date date not null default current_date,
  receipt_url text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_project_expenses_updated_at before update on public.project_expenses
  for each row execute function app.set_updated_at();
create trigger trg_project_expenses_org before insert on public.project_expenses
  for each row execute function app.set_org_from_parent('projects', 'project_id');
create index idx_project_expenses_project on public.project_expenses(project_id, expense_date desc);

create table public.project_payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  direction public.payment_direction not null,
  amount numeric(14,2) not null default 0 check (amount >= 0),
  payment_date date not null default current_date,
  method text,
  reference_note text,
  receipt_url text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_project_payments_updated_at before update on public.project_payments
  for each row execute function app.set_updated_at();
create trigger trg_project_payments_org before insert on public.project_payments
  for each row execute function app.set_org_from_parent('projects', 'project_id');
create index idx_project_payments_project on public.project_payments(project_id, payment_date desc);
