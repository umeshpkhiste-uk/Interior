-- Room types seen on full-house plans that had no category of their own.
alter type public.room_category add value if not exists 'lobby';
alter type public.room_category add value if not exists 'drawing_room';
alter type public.room_category add value if not exists 'garage';
alter type public.room_category add value if not exists 'staircase';
alter type public.room_category add value if not exists 'porch';
alter type public.room_category add value if not exists 'store_room';

-- Sides of a room left open on the 2D plan (no wall), in the room's own frame.
alter table public.project_rooms
  add column plan_open_walls text[] not null default '{}'
    check (plan_open_walls <@ array['top', 'right', 'bottom', 'left']::text[]);

-- Paved passage around the building on the 2D plan: { top, right, bottom, left } in feet.
alter table public.projects
  add column plan_passage jsonb;
