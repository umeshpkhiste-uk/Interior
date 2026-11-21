import { listRoomsForProject } from "@/lib/data/rooms";
import { autoArrange, clampItem, defaultFurniture, footprint, type FloorPlanRoom, type PlanOpening, type PlanRotation } from "@/lib/calculations/floor-plan";
import {
  FLOOR_MATERIALS,
  NO_PASSAGE,
  PLAN_WALLS,
  furnitureItemSchema,
  passageSchema,
  wallGapSchema,
  wallDesignSchema,
  type FloorMaterial,
  type PlanPassage,
} from "@/lib/validations/floor-plan";
import { createClient } from "@/lib/supabase/server";

export type MissingFloorPlanInput = {
  roomId: string | null;
  message: string;
  href: string;
};

export type FloorPlanResult = {
  rooms: FloorPlanRoom[];
  missing: MissingFloorPlanInput[];
  passage: PlanPassage;
};

async function getPlanSettings(
  organizationId: string,
  projectId: string
): Promise<{ passage: PlanPassage; houseFloor: FloorMaterial | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("plan_passage, plan_floor_material")
    .eq("organization_id", organizationId)
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  const parsed = passageSchema.safeParse(data?.plan_passage);
  const floor = data?.plan_floor_material ?? "";
  return {
    passage: parsed.success ? parsed.data : NO_PASSAGE,
    houseFloor: (FLOOR_MATERIALS as readonly string[]).includes(floor) ? (floor as FloorMaterial) : null,
  };
}

/**
 * Rooms keep the position saved from the 2D editor; any room not placed yet
 * (new, or never saved) is auto-arranged in rows beneath the placed ones.
 */
export async function getFloorPlan(organizationId: string, projectId: string): Promise<FloorPlanResult> {
  const [rows, { passage, houseFloor }] = await Promise.all([
    listRoomsForProject(organizationId, projectId),
    getPlanSettings(organizationId, projectId),
  ]);

  if (rows.length === 0) {
    return {
      rooms: [],
      passage,
      missing: [
        { roomId: null, message: "Add at least one room with its length and width.", href: `/projects/${projectId}?tab=rooms` },
      ],
    };
  }

  const missing: MissingFloorPlanInput[] = [];
  const placed: FloorPlanRoom[] = [];
  const unplaced: FloorPlanRoom[] = [];

  for (const row of rows) {
    const lengthFt = Number(row.length_ft ?? 0);
    const widthFt = Number(row.width_ft ?? 0);
    if (lengthFt <= 0 || widthFt <= 0) {
      missing.push({
        roomId: row.id,
        message: `${row.room_name}: enter the length and width.`,
        href: `/projects/${projectId}?tab=rooms&focusRoom=${row.id}#room-${row.id}`,
      });
      continue;
    }
    const openings = row.openings.flatMap((o): PlanOpening[] => {
      if (o.opening_type === "other" || o.quantity <= 0) return [];
      const base = {
        rowId: o.id,
        type: o.opening_type,
        widthFt: Number(o.width ?? 0),
        heightFt: Number(o.height ?? 0),
        swing: (o.plan_swing ?? 0) as PlanOpening["swing"],
        fullHeight: o.opening_type === "window" && Boolean(o.plan_full_height),
        mainDoor: o.opening_type === "door" && Boolean(o.plan_main_door),
      };
      if (o.quantity === 1) {
        const wall = (PLAN_WALLS as readonly string[]).includes(o.plan_wall ?? "") ? (o.plan_wall as PlanOpening["wall"]) : null;
        return [{ ...base, id: o.id, wall, offset: o.plan_offset == null ? null : Number(o.plan_offset), movable: true }];
      }
      return Array.from({ length: o.quantity }, (_, k) => ({ ...base, id: `${o.id}#${k}`, wall: null, offset: null, movable: false }));
    });

    const savedFurniture = furnitureItemSchema.array().safeParse(row.plan_furniture);
    const furniture = savedFurniture.success
      ? savedFurniture.data.map((item) => clampItem(item, { lengthFt, widthFt }))
      : defaultFurniture({ category: row.room_category, lengthFt, widthFt });

    const room: FloorPlanRoom = {
      id: row.id,
      name: row.room_name,
      category: row.room_category,
      unitSystem: row.unit_system,
      length: Number(row.length ?? 0),
      width: Number(row.width ?? 0),
      lengthFt,
      widthFt,
      heightFt: Number(row.height_ft ?? 0) > 0 ? Number(row.height_ft) : 10,
      x: Number(row.plan_x ?? 0),
      y: Number(row.plan_y ?? 0),
      rotation: (row.plan_rotation ?? 0) as PlanRotation,
      openings,
      furniture,
      wallColor: row.plan_wall_color,
      // One floor for the whole house, so rooms don't look like separate buildings.
      floorMaterial: houseFloor,
      wallGaps: wallGapSchema.array().safeParse(row.plan_wall_gaps).data ?? [],
      wallDesigns: wallDesignSchema.array().safeParse(row.plan_wall_designs).data ?? [],
      openWalls: (row.plan_open_walls ?? []).filter((w): w is (typeof PLAN_WALLS)[number] =>
        (PLAN_WALLS as readonly string[]).includes(w)
      ),
    };
    if (row.plan_x != null && row.plan_y != null) placed.push(room);
    else unplaced.push(room);
  }

  const startY = placed.reduce((max, r) => Math.max(max, r.y + footprint(r).h), 0);
  return { rooms: [...placed, ...autoArrange(unplaced, startY)], missing, passage };
}
