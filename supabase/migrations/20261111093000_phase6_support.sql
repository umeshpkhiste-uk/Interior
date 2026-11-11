-- Phase 6 schema gaps found while implementing the calculation engine against
-- the resolved formulas in EXCEL_TO_WEBAPP_MAPPING.md. None of these tables
-- have rows yet, so columns are added/extended rather than reshaped.
--
-- Gaps fixed here (documented as mapping-doc decisions #15-#18):
--  #15 ceiling_estimations had no rate for LED strip lighting (cove_length's
--      per-rft cost) distinct from the per-point downlight rate.
--  #16 paint_estimations had no margin_pct/rounding_unit, so there was no way
--      to go from cost to a selling price (every other estimator has this).
--      Also no distinct rate for wallpaper installation (fixing) per roll,
--      which is a different cost basis (per roll) than the paint labour
--      rate (per sqft).
--  #17 flooring_estimations had no margin_pct/rounding_unit/selling_price at
--      all, despite the source sheet explicitly pricing flooring with a
--      ₹500 rounding step.
--  #18 electrical had no project-level margin/price step either, and
--      Ply & Laminate (panel_cut_lists) had nowhere to hold its aggregate
--      laminate/edge-band rates, fixings %, margin, or resulting price —
--      added as a one-row-per-project settings table, mirroring
--      electrical_project_settings.

alter table public.ceiling_estimations
  add column led_strip_rate numeric(12,2) not null default 0 check (led_strip_rate >= 0);

alter table public.paint_estimations
  add column margin_pct numeric(6,4) not null default 0 check (margin_pct >= 0),
  add column rounding_unit numeric(10,2) not null default 500 check (rounding_unit > 0),
  add column wallpaper_fixing_rate numeric(12,2) not null default 0 check (wallpaper_fixing_rate >= 0);

alter table public.flooring_estimations
  add column margin_pct numeric(6,4) not null default 0 check (margin_pct >= 0),
  add column rounding_unit numeric(10,2) not null default 500 check (rounding_unit > 0),
  add column selling_price numeric(14,2) not null default 0;

alter table public.electrical_project_settings
  add column margin_pct numeric(6,4) not null default 0 check (margin_pct >= 0),
  add column rounding_unit numeric(10,2) not null default 500 check (rounding_unit > 0),
  add column material_cost numeric(14,2) not null default 0,
  add column total_cost numeric(14,2) not null default 0,
  add column selling_price numeric(14,2) not null default 0;

create table public.plywood_project_settings (
  project_id uuid primary key references public.projects(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  laminate_rate_per_sheet numeric(12,2) not null default 0 check (laminate_rate_per_sheet >= 0),
  edge_band_rate_per_rft numeric(12,2) not null default 0 check (edge_band_rate_per_rft >= 0),
  fixings_pct numeric(6,4) not null default 0 check (fixings_pct >= 0),
  margin_pct numeric(6,4) not null default 0 check (margin_pct >= 0),
  rounding_unit numeric(10,2) not null default 500 check (rounding_unit > 0),
  material_cost numeric(14,2) not null default 0,
  total_cost numeric(14,2) not null default 0,
  selling_price numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_plywood_project_settings_updated_at before update on public.plywood_project_settings
  for each row execute function app.set_updated_at();
create trigger trg_plywood_project_settings_org before insert on public.plywood_project_settings
  for each row execute function app.set_org_from_parent('projects', 'project_id');

alter table public.plywood_project_settings enable row level security;
create policy plywood_project_settings_select on public.plywood_project_settings
  for select using (app.is_org_member(organization_id));
create policy plywood_project_settings_write on public.plywood_project_settings
  for all using (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]))
  with check (app.has_org_role(organization_id, array['studio_owner', 'manager', 'designer']::public.org_role[]));
