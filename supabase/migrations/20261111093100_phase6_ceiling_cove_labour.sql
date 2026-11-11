-- Decision #15 (amended): the source sheet's ceiling labour formula is
-- `area×labourRate + coveLength×coveWorkRate` — a separate per-rft labour
-- rate for cove construction, distinct from the flat area-based labour
-- rate. Missed on the first Phase 6 pass; added here before any UI reads it.
alter table public.ceiling_estimations
  add column cove_labour_rate numeric(12,2) not null default 0 check (cove_labour_rate >= 0);
