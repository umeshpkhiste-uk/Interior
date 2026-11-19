import { listRoomsForProject } from "@/lib/data/rooms";
import { ROOM_CATEGORY_LABELS } from "@/lib/validations/room";

export type FloorPlanOpening = { type: "door" | "window" | "other"; quantity: number };

export type FloorPlanRoom = {
  id: string;
  name: string;
  categoryLabel: string;
  x: number;
  y: number;
  w: number;
  h: number;
  lengthFt: number;
  widthFt: number;
  openings: FloorPlanOpening[];
};

export type FloorPlanLayout = {
  rooms: FloorPlanRoom[];
  totalWidthFt: number;
  totalHeightFt: number;
  totalAreaSqft: number;
};

export type MissingFloorPlanInput = {
  roomId: string | null;
  message: string;
  /** Query params for the link back to the project's Rooms tab. */
  href: string;
};

export type FloorPlanResult = {
  layout: FloorPlanLayout | null;
  missing: MissingFloorPlanInput[];
};

/**
 * Builds a to-scale 2D schematic purely from each project's existing Room
 * Measurements (length_ft/width_ft, already standardized to feet regardless
 * of the project's unit system) — nothing new for the user to enter. Rooms
 * are auto-arranged shelf-style by floor area (largest first); this is a
 * proportional layout, not the building's true room adjacency, since that
 * isn't captured anywhere yet.
 */
export async function getFloorPlan(organizationId: string, projectId: string): Promise<FloorPlanResult> {
  const rooms = await listRoomsForProject(organizationId, projectId);

  if (rooms.length === 0) {
    return {
      layout: null,
      missing: [
        {
          roomId: null,
          message: "Add at least one room with its length and width.",
          href: `/projects/${projectId}?tab=rooms`,
        },
      ],
    };
  }

  const missing: MissingFloorPlanInput[] = [];
  const usable: { id: string; name: string; categoryLabel: string; lengthFt: number; widthFt: number; openings: FloorPlanOpening[] }[] = [];

  for (const room of rooms) {
    const lengthFt = Number(room.length_ft ?? 0);
    const widthFt = Number(room.width_ft ?? 0);
    if (lengthFt <= 0 || widthFt <= 0) {
      missing.push({
        roomId: room.id,
        message: `${room.room_name}: enter the length and width.`,
        href: `/projects/${projectId}?tab=rooms&focusRoom=${room.id}#room-${room.id}`,
      });
      continue;
    }
    const openingsByType = new Map<FloorPlanOpening["type"], number>();
    for (const opening of room.openings) {
      openingsByType.set(opening.opening_type, (openingsByType.get(opening.opening_type) ?? 0) + opening.quantity);
    }
    usable.push({
      id: room.id,
      name: room.room_name,
      categoryLabel: ROOM_CATEGORY_LABELS[room.room_category],
      lengthFt,
      widthFt,
      openings: [...openingsByType.entries()].map(([type, quantity]) => ({ type, quantity })),
    });
  }

  if (usable.length === 0) {
    return { layout: null, missing };
  }

  const layout = packRoomsIntoShelves(usable);
  return { layout, missing };
}

function packRoomsIntoShelves(
  rooms: { id: string; name: string; categoryLabel: string; lengthFt: number; widthFt: number; openings: FloorPlanOpening[] }[]
): FloorPlanLayout {
  const totalArea = rooms.reduce((acc, r) => acc + r.lengthFt * r.widthFt, 0);
  const maxRowWidth = Math.max(...rooms.map((r) => r.lengthFt), Math.sqrt(totalArea) * 1.3);

  const sorted = [...rooms].sort((a, b) => b.lengthFt * b.widthFt - a.lengthFt * a.widthFt);

  const placed: FloorPlanRoom[] = [];
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;
  let maxX = 0;

  for (const room of sorted) {
    if (cursorX > 0 && cursorX + room.lengthFt > maxRowWidth) {
      cursorY += rowHeight;
      cursorX = 0;
      rowHeight = 0;
    }
    placed.push({
      id: room.id,
      name: room.name,
      categoryLabel: room.categoryLabel,
      x: cursorX,
      y: cursorY,
      w: room.lengthFt,
      h: room.widthFt,
      lengthFt: room.lengthFt,
      widthFt: room.widthFt,
      openings: room.openings,
    });
    cursorX += room.lengthFt;
    rowHeight = Math.max(rowHeight, room.widthFt);
    maxX = Math.max(maxX, cursorX);
  }

  return {
    rooms: placed,
    totalWidthFt: maxX,
    totalHeightFt: cursorY + rowHeight,
    totalAreaSqft: totalArea,
  };
}
