create type public.inspiration_category as enum (
  'living_room', 'bedroom', 'modular_kitchen', 'bathroom', 'dining_room', 'wardrobe',
  'false_ceiling', 'lighting', 'flooring', 'wallpaper', 'office_interiors'
);

create table public.moodboards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_moodboards_updated_at before update on public.moodboards
  for each row execute function app.set_updated_at();
create index idx_moodboards_org on public.moodboards(organization_id);
create index idx_moodboards_project on public.moodboards(project_id);

create table public.inspiration_images (
  id uuid primary key default gen_random_uuid(),
  moodboard_id uuid references public.moodboards(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  room_id uuid references public.project_rooms(id) on delete set null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category public.inspiration_category not null,
  image_url text not null,
  notes text,
  material_specification text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_inspiration_images_has_parent check (
    moodboard_id is not null or project_id is not null or room_id is not null
  )
);
create trigger trg_inspiration_images_updated_at before update on public.inspiration_images
  for each row execute function app.set_updated_at();
create index idx_inspiration_images_moodboard on public.inspiration_images(moodboard_id);
create index idx_inspiration_images_project on public.inspiration_images(project_id);

-- inspiration_images can hang off any of three different parents, so it
-- needs a dedicated trigger rather than the generic single-parent one in
-- the extensions_and_helpers migration.
create or replace function app.set_org_for_inspiration_images()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
begin
  if new.moodboard_id is not null then
    select organization_id into v_org from public.moodboards where id = new.moodboard_id;
  elsif new.project_id is not null then
    select organization_id into v_org from public.projects where id = new.project_id;
  elsif new.room_id is not null then
    select organization_id into v_org from public.project_rooms where id = new.room_id;
  end if;
  if v_org is null then
    raise exception 'could not resolve organization_id for inspiration_images row';
  end if;
  new.organization_id := v_org;
  return new;
end;
$$;
create trigger trg_inspiration_images_org before insert on public.inspiration_images
  for each row execute function app.set_org_for_inspiration_images();
