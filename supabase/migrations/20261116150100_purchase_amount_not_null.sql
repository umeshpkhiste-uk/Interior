-- The generated amount/value columns can never actually be null (qty and
-- rate are both NOT NULL), but the generator left them nullable by
-- default. Mark them NOT NULL so generated TS types don't force every
-- consumer to null-guard a value that's always present.
alter table public.purchase_orders alter column amount set not null;
alter table public.material_issues alter column value set not null;
