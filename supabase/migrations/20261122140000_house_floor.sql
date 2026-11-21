-- One floor finish for the whole house (2D plan and 3D view), instead of a different floor per room.
alter table public.projects add column plan_floor_material text;
