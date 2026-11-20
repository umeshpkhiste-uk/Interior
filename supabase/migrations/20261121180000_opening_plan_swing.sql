-- Door swing on the 2D plan: 0 = hinge at start, opens into the room; 1 = hinge at end,
-- into the room; 2 = hinge at end, opens outward; 3 = hinge at start, outward.
alter table public.room_openings
  add column plan_swing smallint not null default 0 check (plan_swing between 0 and 3);
