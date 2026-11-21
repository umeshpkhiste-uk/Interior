-- Finishes chosen per room in the Design views. Null = the default for the room type.
alter table public.project_rooms
  add column plan_wall_color text check (plan_wall_color ~ '^#[0-9a-fA-F]{6}$'),
  add column plan_floor_material text check (
    plan_floor_material in (
      'wood', 'walnut', 'tile', 'marble', 'granite', 'stone', 'wetTile', 'concrete', 'carpet', 'paver'
    )
  );
