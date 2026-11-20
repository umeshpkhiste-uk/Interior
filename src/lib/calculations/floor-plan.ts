import type { Database } from "@/lib/supabase/types";
import { FURNITURE_SIZES, type FurnitureItem, type FurnitureType } from "@/lib/validations/floor-plan";

export type PlanRotation = 0 | 90 | 180 | 270;

export type FloorPlanRoom = {
  id: string;
  name: string;
  category: Database["public"]["Enums"]["room_category"];
  unitSystem: Database["public"]["Enums"]["unit_system"];
  /** Length/width as entered on Room Measurements, in the room's own unit. */
  length: number;
  width: number;
  /** Room's own length (local x-axis) and width (local y-axis) in feet, before rotation. */
  lengthFt: number;
  widthFt: number;
  /** Top-left of the room's rotated footprint, in feet. */
  x: number;
  y: number;
  rotation: PlanRotation;
  doorWidthsFt: number[];
  windowWidthsFt: number[];
  /** In the room's local frame (feet from its own top-left, before the room's rotation). */
  furniture: FurnitureItem[];
};

/** Bounding box of anything with an own size and a quarter-turn rotation. */
export function footprint(box: { rotation: number } & ({ lengthFt: number; widthFt: number } | { w: number; h: number })) {
  const [w, h] = "lengthFt" in box ? [box.lengthFt, box.widthFt] : [box.w, box.h];
  const turned = box.rotation === 90 || box.rotation === 270;
  return { w: turned ? h : w, h: turned ? w : h };
}

/** SVG transform placing an own-frame w × h drawing into its rotated footprint (top-left at 0,0). */
export function rotationTransform(w: number, h: number, rotation: number): string {
  switch (rotation) {
    case 90:
      return `translate(${h} 0) rotate(90)`;
    case 180:
      return `translate(${w} ${h}) rotate(180)`;
    case 270:
      return `translate(0 ${w}) rotate(270)`;
    default:
      return "";
  }
}

/** Converts a movement on screen (plan axes) into the room's own local axes. */
export function toLocalDelta(dx: number, dy: number, rotation: PlanRotation): { dx: number; dy: number } {
  switch (rotation) {
    case 90:
      return { dx: dy, dy: -dx };
    case 180:
      return { dx: -dx, dy: -dy };
    case 270:
      return { dx: -dy, dy: dx };
    default:
      return { dx, dy };
  }
}

/** 10.5 → 10'-6" */
export function formatFeetInches(feet: number): string {
  const totalInches = Math.round(feet * 12);
  return `${Math.floor(totalInches / 12)}'-${totalInches % 12}"`;
}

/** Keeps an item fully inside its room (local frame). */
export function clampItem(item: FurnitureItem, room: Pick<FloorPlanRoom, "lengthFt" | "widthFt">): FurnitureItem {
  const { w, h } = footprint(item);
  return {
    ...item,
    x: Math.min(Math.max(item.x, 0), Math.max(0, room.lengthFt - w)),
    y: Math.min(Math.max(item.y, 0), Math.max(0, room.widthFt - h)),
  };
}

export function newFurnitureItem(type: FurnitureType, room: Pick<FloorPlanRoom, "lengthFt" | "widthFt">, id: string): FurnitureItem {
  const size = FURNITURE_SIZES[type];
  const w = Math.min(size.w, Math.max(1, room.lengthFt - 0.4));
  const h = Math.min(size.h, Math.max(1, room.widthFt - 0.4));
  return clampItem({ id, type, w, h, rotation: 0, x: (room.lengthFt - w) / 2, y: (room.widthFt - h) / 2 }, room);
}

/** Starting furniture for a room that hasn't been customised on the plan yet. */
export function defaultFurniture(room: Pick<FloorPlanRoom, "category" | "lengthFt" | "widthFt">): FurnitureItem[] {
  const L = room.lengthFt;
  const W = room.widthFt;
  const item = (id: string, type: FurnitureType, x: number, y: number, w: number, h: number, rotation: PlanRotation = 0): FurnitureItem => ({
    id, type, x, y, w, h, rotation,
  });

  switch (room.category) {
    case "master_bedroom":
    case "bedroom_2":
    case "bedroom_3": {
      if (L < 8 || W < 8) return [];
      const bedW = Math.min(room.category === "master_bedroom" ? 6 : 5, L - 3.5);
      const bedH = Math.min(6.5, W - 2.5);
      const bx = (L - bedW) / 2;
      const items = [
        item("rug", "rug", Math.max(0.3, bx - 0.8), 2.4, Math.min(bedW + 1.6, L - 0.6), Math.min(5.5, W - 2.8)),
        item("bed", "bed", bx, 0.4, bedW, bedH),
        item("side-left", "side_table", bx - 1.6, 0.4, 1.4, 1.4),
        item("side-right", "side_table", bx + bedW + 0.2, 0.4, 1.4, 1.4),
      ];
      if (L >= 9 && W >= 9) items.push(item("wardrobe", "wardrobe", 0.2, W - 2.2, Math.min(6, L - 4.4), 2));
      return items;
    }
    case "living_room": {
      if (L < 8 || W < 7) return [];
      const sofaLen = Math.min(7, W - 2);
      const rugH = Math.min(6, W - 1);
      return [
        item("rug", "rug", 1.2, (W - rugH) / 2, Math.min(6, L - 2.8), rugH),
        item("sofa", "sofa", 0.3, (W - sofaLen) / 2, sofaLen, 2.8, 270),
        item("coffee-table", "coffee_table", 4, W / 2 - 1.5, 3, 2.2, 90),
        item("tv-unit", "tv_unit", L - 1.5, W / 2 - 2.5, 5, 1.2, 90),
        ...(W >= 8.5 ? [item("plant", "plant", L - 1.5, 0.3, 1.2, 1.2)] : []),
      ];
    }
    case "dining_room": {
      if (Math.min(L, W) < 6.2) return [];
      const plant = Math.min(L, W) >= 8 ? [item("plant", "plant", 0.3, 0.3, 1.2, 1.2)] : [];
      if (L >= W) {
        const tl = Math.min(6, L - 2.5);
        return [item("dining", "dining_set", (L - tl) / 2, (W - 5.8) / 2, tl, 5.8), ...plant];
      }
      const tl = Math.min(6, W - 2.5);
      return [item("dining", "dining_set", (L - 5.8) / 2, (W - tl) / 2, tl, 5.8, 90), ...plant];
    }
    case "kitchen": {
      if (L < 6 || W < 5) return [];
      return [
        item("counter", "counter_l", 0.2, 0.2, L - 0.4, W - 0.4),
        item("sink", "sink", L * 0.55, 0.45, 2.4, 1.5),
        item("hob", "hob", 0.3, W / 2 - 0.45, 1.8, 1.8),
      ];
    }
    case "bathroom": {
      if (L < 3.5 || W < 4) return [];
      return [item("wc", "wc", 0.4, 0.3, 1.6, 2.5), item("basin", "basin", L - 1.9, 0.3, 1.6, 1.2)];
    }
    case "utility": {
      if (L < 4 || W < 3) return [];
      return [item("washer-1", "washer", 0.3, 0.3, 2.2, 2.2), ...(L >= 5.5 ? [item("washer-2", "washer", 2.7, 0.3, 2.2, 2.2)] : [])];
    }
    default:
      return [];
  }
}

type Rect = { x: number; y: number; w: number; h: number };

/** A furniture item's bounding box on the plan (world feet), after the room's rotation. */
function itemPlanRect(room: FloorPlanRoom, item: FurnitureItem): Rect {
  const f = footprint(item);
  const L = room.lengthFt;
  const W = room.widthFt;
  switch (room.rotation) {
    case 90:
      return { x: room.x + W - (item.y + f.h), y: room.y + item.x, w: f.h, h: f.w };
    case 180:
      return { x: room.x + L - (item.x + f.w), y: room.y + W - (item.y + f.h), w: f.w, h: f.h };
    case 270:
      return { x: room.x + item.y, y: room.y + L - (item.x + f.w), w: f.h, h: f.w };
    default:
      return { x: room.x + item.x, y: room.y + item.y, w: f.w, h: f.h };
  }
}

/**
 * Centre point for a room's name + size label: the spot nearest the room's centre
 * whose label box doesn't sit on furniture (rugs don't count), else the centre.
 */
export function labelAnchor(room: FloorPlanRoom, labelW: number, labelH: number): { x: number; y: number } {
  const { w, h } = footprint(room);
  const blockers = room.furniture.filter((f) => f.type !== "rug").map((f) => itemPlanRect(room, f));
  const fractions = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8];
  const candidates = fractions
    .flatMap((fy) => fractions.map((fx) => ({ fx, fy })))
    .sort((a, b) => Math.hypot(a.fx - 0.5, a.fy - 0.5) - Math.hypot(b.fx - 0.5, b.fy - 0.5));
  for (const { fx, fy } of candidates) {
    const cx = room.x + w * fx;
    const cy = room.y + h * fy;
    const box = { x: cx - labelW / 2, y: cy - labelH / 2, w: labelW, h: labelH };
    const inside = box.x >= room.x + 0.2 && box.y >= room.y + 0.2 && box.x + box.w <= room.x + w - 0.2 && box.y + box.h <= room.y + h - 0.2;
    const clear = blockers.every((r) => box.x >= r.x + r.w || r.x >= box.x + box.w || box.y >= r.y + r.h || r.y >= box.y + box.h);
    if (inside && clear) return { x: cx, y: cy };
  }
  return { x: room.x + w / 2, y: room.y + h / 2 };
}

export const WALLS = ["top", "right", "bottom", "left"] as const;
export type Wall = (typeof WALLS)[number];

/**
 * Which of a room's own (local, pre-rotation) walls are shared with another room
 * for at least half their length — i.e. inside walls, where windows don't belong.
 */
export function sharedWalls(room: FloorPlanRoom, rooms: FloorPlanRoom[]): Set<Wall> {
  const a = { ...footprint(room), x: room.x, y: room.y };
  const shared = new Set<Wall>();
  const touch = 0.15;
  for (const other of rooms) {
    if (other.id === room.id) continue;
    const b = { ...footprint(other), x: other.x, y: other.y };
    const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    const worldSides: [number, boolean][] = [
      [0, Math.abs(b.y + b.h - a.y) < touch && overlapX >= a.w / 2],
      [1, Math.abs(b.x - (a.x + a.w)) < touch && overlapY >= a.h / 2],
      [2, Math.abs(b.y - (a.y + a.h)) < touch && overlapX >= a.w / 2],
      [3, Math.abs(b.x + b.w - a.x) < touch && overlapY >= a.h / 2],
    ];
    const steps = room.rotation / 90;
    for (const [worldIndex, isShared] of worldSides) {
      if (isShared) shared.add(WALLS[(worldIndex - steps + 4) % 4]);
    }
  }
  return shared;
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
