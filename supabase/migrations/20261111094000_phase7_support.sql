-- Phase 7 support: automatic quotation numbering (mapping doc decision
-- #11 — the source workbook has no formula for this at all). Format:
-- `{org.quotation_prefix}/{financial_year}/{seq}`, e.g. "QT/2026-27/0001".
-- The sequence resets every Indian financial year (April 1 - March 31),
-- tracked per organization so two studios never collide and a new
-- financial year always restarts at 1.

create table public.quotation_number_sequences (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  financial_year text not null,
  next_seq int not null default 1 check (next_seq >= 1),
  primary key (organization_id, financial_year)
);

alter table public.quotation_number_sequences enable row level security;
create policy quotation_number_sequences_select on public.quotation_number_sequences
  for select using (app.is_org_member(organization_id));
-- No write policy: only allocate_quotation_number() (SECURITY DEFINER) may write.

create or replace function app.current_indian_financial_year()
returns text
language sql
stable
as $$
  select case
    when extract(month from current_date) >= 4
      then extract(year from current_date)::text || '-' || lpad((extract(year from current_date)::int + 1 - 2000)::text, 2, '0')
    else (extract(year from current_date)::int - 1)::text || '-' || lpad((extract(year from current_date)::int - 2000)::text, 2, '0')
  end;
$$;

create or replace function public.allocate_quotation_number(p_org_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_fy text;
  v_seq int;
  v_prefix text;
begin
  if not app.is_org_member(p_org_id) then
    raise exception 'Not a member of this organization';
  end if;

  v_fy := app.current_indian_financial_year();

  insert into public.quotation_number_sequences (organization_id, financial_year, next_seq)
  values (p_org_id, v_fy, 2)
  on conflict (organization_id, financial_year)
  do update set next_seq = quotation_number_sequences.next_seq + 1
  returning next_seq - 1 into v_seq;

  select quotation_prefix into v_prefix from public.organizations where id = p_org_id;

  return coalesce(v_prefix, 'QT') || '/' || v_fy || '/' || lpad(v_seq::text, 4, '0');
end;
$$;

grant execute on function public.allocate_quotation_number(uuid) to authenticated;
