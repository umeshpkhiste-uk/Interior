-- Pieces of wall removed on the 2D plan: [{ wall, from, to }] in the room's own frame
-- (feet along the room's local x for top/bottom walls, local y for left/right).
alter table public.project_rooms
  add column plan_wall_gaps jsonb not null default '[]'::jsonb;

-- Floor-to-ceiling windows (no sill, no head wall).
alter table public.room_openings
  add column plan_full_height boolean not null default false;
