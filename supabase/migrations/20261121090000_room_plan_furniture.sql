-- Furniture placed in a room on the 2D floor plan: an array of
-- { id, type, x, y, w, h, rotation } in the room's own feet coordinates.
-- Null means "not customised yet" (default furniture for the room type).
alter table public.project_rooms
  add column plan_furniture jsonb;
