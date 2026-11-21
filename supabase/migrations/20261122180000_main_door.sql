-- The door marked as the house's main door / entrance on the 2D plan.
alter table public.room_openings add column plan_main_door boolean not null default false;
