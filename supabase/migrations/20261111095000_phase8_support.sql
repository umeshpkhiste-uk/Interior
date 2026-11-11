-- Phase 8 schema gaps found while implementing Rate Revision (sheet 14)
-- and Material vs Labour & Profit Analysis (sheet 12). Documented as
-- mapping-doc decisions #19-#21.

-- #19: material_rates had no fields for the source sheet's planned
-- increase %, business-wide expected monthly volume (decision #13), or
-- market low/high comparison — needed for the Rate Revision calculator.
alter table public.material_rates
  add column planned_increase_pct numeric(6,4) not null default 0 check (planned_increase_pct >= 0),
  add column round_step numeric(10,2) not null default 5 check (round_step > 0),
  add column monthly_volume numeric(12,2) not null default 0 check (monthly_volume >= 0),
  add column market_low numeric(12,2) check (market_low >= 0),
  add column market_high numeric(12,2) check (market_high >= 0);

-- #20: electrical_project_settings' cost had no labour_cost column, so
-- Material vs Labour reporting (decision #6's whole point) couldn't show
-- electrical's labour share at all — material_cost/total_cost existed but
-- the labour split implied by labour_share_pct was never persisted.
alter table public.electrical_project_settings
  add column labour_cost numeric(14,2) not null default 0;

-- #21: the source sheet's profitability table has one manually-typed plug
-- row ("Other carpentry and furniture") whose quoted price is derived
-- (MAX(0, BOQtotal - named heads)) but whose material/labour cost is
-- typed by hand — there was nowhere to store that input.
alter table public.project_settings
  add column other_head_material_cost numeric(14,2) not null default 0,
  add column other_head_labour_cost numeric(14,2) not null default 0;
