-- Shared extensions, helper schema, and RLS support functions.
--
-- JUDGMENT CALL: organization_id is denormalized onto every table in this
-- schema (including ones DATABASE_SCHEMA.md doesn't list it for explicitly,
-- e.g. room_openings, kitchen_accessories, boq_items, quotation_items,
-- project_expenses, rate_history, ...) and kept in sync via BEFORE INSERT
-- triggers that copy it from the parent row. This matches
-- DATABASE_SCHEMA.md's own blanket rule ("scoped to organization_id for
-- multi-tenancy ... except where noted") and keeps every RLS policy a
-- single indexed equality check instead of a join chain up through
-- projects/rooms/estimations, which is both simpler and significantly
-- faster under Postgres RLS (join-heavy RLS predicates are a well-known
-- performance and correctness pitfall).

create extension if not exists pgcrypto;

create schema if not exists app;
grant usage on schema app to authenticated;

-- Shared role enum, used by organization_members and every RLS policy.
create type public.org_role as enum (
  'super_admin', 'studio_owner', 'manager', 'designer', 'accountant', 'viewer'
);

-- updated_at maintenance --------------------------------------------------

create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Organization-membership-dependent helper functions (current_org_ids,
-- user_role, is_super_admin, is_org_member, has_org_role) live in
-- 20261111090150_org_membership_helpers.sql, which runs AFTER the tenancy
-- migration creates organization_members. Defining them here would fail at
-- CREATE FUNCTION time (Postgres validates the function body's relation
-- references immediately, even for `language sql`), since the table
-- wouldn't exist yet.

alter default privileges in schema app grant execute on functions to authenticated;

-- generic "copy organization_id from a single parent row" trigger ---------
-- Usage: create trigger ... before insert on <child> for each row
--   execute function app.set_org_from_parent('<parent_table>', '<parent_id_column_on_child>');
-- Not used for tables with more than one possible parent (see
-- inspiration_images' dedicated trigger in the inspiration migration).

create or replace function app.set_org_from_parent()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  parent_table text := tg_argv[0];
  parent_id_col text := tg_argv[1];
  v_parent_id uuid;
  v_org uuid;
begin
  v_parent_id := (to_jsonb(new)->>parent_id_col)::uuid;
  if v_parent_id is null then
    raise exception '% requires % to be set before organization_id can be resolved',
      tg_table_name, parent_id_col;
  end if;
  execute format('select organization_id from %I where id = $1', parent_table)
    into v_org using v_parent_id;
  if v_org is null then
    raise exception 'could not resolve organization_id for % via %=%',
      tg_table_name, parent_id_col, v_parent_id;
  end if;
  new.organization_id := v_org;
  return new;
end;
$$;

-- Generic "reject mutation" trigger, used to enforce true immutability on
-- append-only tables (quotation_snapshots) even against elevated roles.
create or replace function app.reject_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception '% rows are immutable and cannot be updated or deleted', tg_table_name;
end;
$$;
