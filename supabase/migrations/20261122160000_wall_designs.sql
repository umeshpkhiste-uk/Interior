-- Walls picked in the 3D view as "design walls": always shown full height, optionally with a
-- wall-mounted design (shelves / display unit). [{ "wall": "top", "design": "shelves" | "display_unit" | null }]
alter table public.project_rooms add column plan_wall_designs jsonb not null default '[]'::jsonb;
