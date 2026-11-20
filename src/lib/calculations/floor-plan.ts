import type { Database } from "@/lib/supabase/types";

export type PlanRotation = 0 | 90 | 180 | 270;

export type FloorPlanRoom = {
  id: string;
  name: string;
  category: Database["public"]["Enums"]["room_category"];
  /** Room's own length (local x-axis) and width (local y-axis), before rotation. */
  lengthFt: number;
  widthFt: number;
  /** Top-left of the room's rotated footprint, in feet. */
  x: number;
  y: number;
  rotation: PlanRotation;
  doorWidthsFt: number[];
  windowWidthsFt: number[];
};

export function footprint(room: Pick<FloorPlanRoom, "lengthFt" | "widthFt" | "rotation">) {
  const turned = room.rotation === 90 || room.rotation === 270;
  return { w: turned ? room.widthFt : room.lengthFt, h: turned ? room.lengthFt : room.widthFt };
}

/** 10.5 → 10'-6" */
export function formatFeetInches(feet: number): string {
  const totalInches = Math.round(feet * 12);
  return `${Math.floor(totalInches / 12)}'-${totalInches % 12}"`;
}

const OVERLAP_TOLERANCE_FT = 0.05;

export function overlappingRoomIds(rooms: FloorPlanRoom[]): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < rooms.length; i++) {
    const a = rooms[i];
    const fa = footprint(a);
    for (let j = i + 1; j < rooms.length; j++) {
      const b = rooms[j];
      const fb = footprint(b);
      const overlapX = Math.min(a.x + fa.w, b.x + fb.w) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + fa.h, b.y + fb.h) - Math.max(a.y, b.y);
      if (overlapX > OVERLAP_TOLERANCE_FT && overlapY > OVERLAP_TOLERANCE_FT) {
        ids.add(a.id);
        ids.add(b.id);
      }
    }
  }
  return ids;
}
