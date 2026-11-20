import { listRoomsForProject } from "@/lib/data/rooms";
import { footprint, type FloorPlanRoom, type PlanRotation } from "@/lib/calculations/floor-plan";

export type MissingFloorPlanInput = {
  roomId: string | null;
  message: string;
  href: string;
};

export type FloorPlanResult = {
  rooms: FloorPlanRoom[];
  missing: MissingFloorPlanInput[];
};

/**
 * Rooms keep the position saved from the 2D editor; any room not placed yet
 * (new, or never saved) is auto-arranged in rows beneath the placed ones.
 */
export async function getFloorPlan(organizationId: string, projectId: string): Promise<FloorPlanResult> {
  const rows = await listRoomsForProject(organizationId, projectId);

  if (rows.length === 0) {
    return {
      rooms: [],
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
    const widthsOf = (type: "door" | "window") =>
      row.openings
        .filter((o) => o.opening_type === type)
        .flatMap((o) => Array.from({ length: o.quantity }, () => Number(o.width ?? 0)));

    const room: FloorPlanRoom = {
      id: row.id,
      name: row.room_name,
      category: row.room_category,
      lengthFt,
      widthFt,
      x: Number(row.plan_x ?? 0),
      y: Number(row.plan_y ?? 0),
      rotation: (row.plan_rotation ?? 0) as PlanRotation,
      doorWidthsFt: widthsOf("door"),
      windowWidthsFt: widthsOf("window"),
    };
    if (row.plan_x != null && row.plan_y != null) placed.push(room);
    else unplaced.push(room);
  }

  const startY = placed.reduce((max, r) => Math.max(max, r.y + footprint(r).h), 0);
  return { rooms: [...placed, ...packIntoRows(unplaced, startY)], missing };
}

function packIntoRows(rooms: FloorPlanRoom[], startY: number): FloorPlanRoom[] {
  if (rooms.length === 0) return [];
  const totalArea = rooms.reduce((acc, r) => acc + r.lengthFt * r.widthFt, 0);
  const maxRowWidth = Math.max(...rooms.map((r) => r.lengthFt), Math.sqrt(totalArea) * 1.3);
  const sorted = [...rooms].sort((a, b) => b.lengthFt * b.widthFt - a.lengthFt * a.widthFt);

  let cursorX = 0;
  let cursorY = startY;
  let rowHeight = 0;
  return sorted.map((room) => {
    if (cursorX > 0 && cursorX + room.lengthFt > maxRowWidth) {
      cursorY += rowHeight;
      cursorX = 0;
      rowHeight = 0;
    }
    const positioned = { ...room, x: cursorX, y: cursorY, rotation: 0 as PlanRotation };
    cursorX += room.lengthFt;
    rowHeight = Math.max(rowHeight, room.widthFt);
    return positioned;
  });
}
