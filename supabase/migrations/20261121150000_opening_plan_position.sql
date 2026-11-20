-- Where a door/window sits on the 2D plan: which of the room's own walls, and how far
-- along it (feet from the start of that wall). Null = placed automatically.
alter table public.room_openings
  add column plan_wall text check (plan_wall in ('top', 'right', 'bottom', 'left')),
  add column plan_offset numeric(8, 2) check (plan_offset >= 0);
