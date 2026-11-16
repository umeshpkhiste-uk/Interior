-- Labour & Carpenter Payment Kit: workers, daily attendance/piece work,
-- advances and weekly pay, modelled after Labour-Carpenter-Payment-Kit.xlsx.
-- Workers (carpenters, helpers, painters, electricians...) are a new
-- registry -- the app's existing "labour_cost"/"labour_payment" fields
-- (kitchen/paint/electrical estimations, project_expenses categories) are
-- budgeted or lump-sum money, not a payroll of named workers, so there is
-- no existing table to extend here, unlike the vendor/project kits.

create type public.labour_trade as enum (
  'carpenter', 'helper', 'painter', 'electrician', 'ceiling_worker', 'polish_worker', 'tile_mason', 'other'
);

create type public.labour_attendance_status as enum ('full_day', 'half_day', 'piece_work_only', 'absent');

alter table public.organizations
  add column next_worker_seq int not null default 1;

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  worker_code text not null,
  name text not null,
  trade public.labour_trade not null default 'other',
  daily_wage numeric(10,2) not null check (daily_wage >= 0),
  phone text,
  team text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, worker_code)
);
create trigger trg_workers_updated_at before update on public.workers
  for each row execute function app.set_updated_at();
create index idx_workers_org on public.workers(organization_id);

create table public.labour_attendance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  attendance_date date not null default current_date,
  status public.labour_attendance_status not null default 'full_day',
  day_wage numeric(10,2) not null check (day_wage >= 0),
  hours_in_day numeric(4,2) not null default 8 check (hours_in_day > 0),
  overtime_hours numeric(5,2) not null default 0 check (overtime_hours >= 0),
  piece_work text,
  pieces numeric(10,2) check (pieces >= 0),
  rate_per_piece numeric(10,2) check (rate_per_piece >= 0),
  day_pay numeric(10,2) generated always as (
    round(
      (case status
        when 'full_day' then day_wage
        when 'half_day' then day_wage / 2
        else 0
      end)
      + (overtime_hours * day_wage / hours_in_day),
    2)
  ) stored not null,
  piece_pay numeric(10,2) generated always as (round(coalesce(pieces, 0) * coalesce(rate_per_piece, 0), 2)) stored not null,
  total_pay numeric(10,2) generated always as (
    round(
      (case status
        when 'full_day' then day_wage
        when 'half_day' then day_wage / 2
        else 0
      end)
      + (overtime_hours * day_wage / hours_in_day)
      + (coalesce(pieces, 0) * coalesce(rate_per_piece, 0)),
    2)
  ) stored not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (worker_id, attendance_date)
);
create trigger trg_labour_attendance_updated_at before update on public.labour_attendance
  for each row execute function app.set_updated_at();
create index idx_labour_attendance_org_worker on public.labour_attendance(organization_id, worker_id);
create index idx_labour_attendance_org_date on public.labour_attendance(organization_id, attendance_date);
create index idx_labour_attendance_org_project on public.labour_attendance(organization_id, project_id);

create table public.labour_advances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  advance_date date not null default current_date,
  amount numeric(10,2) not null check (amount > 0),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_labour_advances_updated_at before update on public.labour_advances
  for each row execute function app.set_updated_at();
create index idx_labour_advances_org_worker on public.labour_advances(organization_id, worker_id);

create table public.labour_weekly_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  week_starting date not null,
  advance_recovered numeric(10,2) not null default 0 check (advance_recovered >= 0),
  paid numeric(10,2) not null default 0 check (paid >= 0),
  mode public.vendor_payment_mode not null default 'cash',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (worker_id, week_starting)
);
create trigger trg_labour_weekly_payments_updated_at before update on public.labour_weekly_payments
  for each row execute function app.set_updated_at();
create index idx_labour_weekly_payments_org_worker on public.labour_weekly_payments(organization_id, worker_id);

-- RLS: labour money (advances, weekly pay) follows the same roles as
-- purchasing/vendor payments; attendance is day-to-day site logistics, so
-- designers can log it too, same split as material_issues.
alter table public.workers enable row level security;
create policy workers_select on public.workers
  for select using (app.is_org_member(organization_id));
create policy workers_write on public.workers
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[]));

alter table public.labour_attendance enable row level security;
create policy labour_attendance_select on public.labour_attendance
  for select using (app.is_org_member(organization_id));
create policy labour_attendance_write on public.labour_attendance
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));

alter table public.labour_advances enable row level security;
create policy labour_advances_select on public.labour_advances
  for select using (app.is_org_member(organization_id));
create policy labour_advances_write on public.labour_advances
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[]));

alter table public.labour_weekly_payments enable row level security;
create policy labour_weekly_payments_select on public.labour_weekly_payments
  for select using (app.is_org_member(organization_id));
create policy labour_weekly_payments_write on public.labour_weekly_payments
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'accountant']::public.org_role[]));

create or replace function public.allocate_worker_code(p_org_id uuid)
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
  set next_worker_seq = next_worker_seq + 1
  where id = p_org_id
  returning next_worker_seq - 1 into v_seq;

  if v_seq is null then
    raise exception 'organization % not found', p_org_id;
  end if;

  return 'WK-' || lpad(v_seq::text, 2, '0');
end;
$$;
grant execute on function public.allocate_worker_code(uuid) to authenticated;
