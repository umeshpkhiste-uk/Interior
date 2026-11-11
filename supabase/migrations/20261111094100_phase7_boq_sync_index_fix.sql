-- The original sync-idempotency unique index (mapping doc decision #7) was
-- a PARTIAL index (`where source_module is not null`), but Supabase/PostgREST
-- upserts build a plain `ON CONFLICT (col1, col2, col3)` clause with no WHERE
-- predicate, which Postgres refuses to match against a partial index ("no
-- unique or exclusion constraint matching the ON CONFLICT specification").
--
-- Dropping the partial predicate and making this a plain unique index is
-- safe: Postgres already treats NULL as distinct from NULL in a unique
-- index, so manual items (source_module IS NULL, source_estimation_id IS
-- NULL) still never collide with each other — the WHERE clause was
-- unnecessary, not load-bearing.
drop index if exists public.uq_boq_items_sync;
create unique index uq_boq_items_sync on public.boq_items(project_id, source_module, source_estimation_id);
