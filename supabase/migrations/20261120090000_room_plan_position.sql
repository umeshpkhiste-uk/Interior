-- Position of each room on the project's 2D floor plan, in feet from the
-- plan's top-left corner. Null means "not placed yet" (auto-arranged).
alter table public.project_rooms
  add column plan_x numeric(8, 2),
  add column plan_y numeric(8, 2),
  add column plan_rotation smallint not null default 0
    check (plan_rotation in (0, 90, 180, 270));
