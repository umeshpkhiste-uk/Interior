-- Phase 9: Supabase Storage bucket for the Inspiration Library (master prompt §22).
-- Tables (moodboards, inspiration_images) and their row RLS already exist from the
-- Phase 3 schema scaffold. This migration adds the matching private storage bucket.
-- Objects are keyed "{organization_id}/{project_id}/{uuid}.{ext}" so storage.objects
-- RLS can scope access by organization membership without a join, the same pattern
-- used by every other multi-tenant table.

insert into storage.buckets (id, name, public)
values ('inspiration', 'inspiration', false)
on conflict (id) do nothing;

create policy inspiration_storage_select on storage.objects
  for select using (
    bucket_id = 'inspiration'
    and app.has_org_role((storage.foldername(name))[1]::uuid, array['studio_owner', 'manager', 'designer', 'viewer']::public.org_role[])
  );
create policy inspiration_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'inspiration'
    and app.has_org_role((storage.foldername(name))[1]::uuid, array['studio_owner', 'manager', 'designer']::public.org_role[])
  );
create policy inspiration_storage_delete on storage.objects
  for delete using (
    bucket_id = 'inspiration'
    and app.has_org_role((storage.foldername(name))[1]::uuid, array['studio_owner', 'manager', 'designer']::public.org_role[])
  );
