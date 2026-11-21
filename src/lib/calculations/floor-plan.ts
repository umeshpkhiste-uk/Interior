import type { Database } from "@/lib/supabase/types";
import {
  FURNITURE_SIZES,
  PLAN_WALLS,
  type FloorMaterial,
  type FurnitureItem,
  type FurnitureType,
  type WallGap,
  type WallDesign,
} from "@/lib/validations/floor-plan";

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
  /** Ceiling height in feet (walls are built to this in 3D). */
  heightFt: number;
  /** Top-left of the room's rotated footprint, in feet. */
  x: number;
  y: number;
  rotation: PlanRotation;
  openings: PlanOpening[];
  /** In the room's local frame (feet from its own top-left, before the room's rotation). */
  furniture: FurnitureItem[];
  /** Own-frame sides drawn without a wall. */
  openWalls: Wall[];
  /**
   * Pieces of wall removed on the plan, on own-frame walls: from/to are feet along the
   * room's local x (top/bottom walls) or local y (left/right walls).
   */
  wallGaps: WallGap[];
  /** Chosen wall paint (hex) and floor material; null = default for the room type. */
  wallColor: string | null;
  floorMaterial: FloorMaterial | null;
  /** Design walls picked in the 3D view (own-frame walls). */
  wallDesigns?: WallDesign[];
};

export type PlanOpening = {
  /** Unique on the plan; equals rowId unless a Room Measurements row has quantity > 1. */
  id: string;
  rowId: string;
  type: "door" | "window";
  widthFt: number;
  heightFt: number;
  /** Own-frame wall and feet along it; null = placed automatically. */
  wall: Wall | null;
  offset: number | null;
  /** Door swing: 0 hinge-start/inward, 1 hinge-end/inward, 2 hinge-end/outward, 3 hinge-start/outward. */
  swing: DoorSwing;
  /** Windows only: runs from the floor to the ceiling. */
  fullHeight: boolean;
  /** Rows with quantity > 1 are drawn but can only be edited on Room Measurements. */
  movable: boolean;
};

export type DoorSwing = 0 | 1 | 2 | 3;

export type ResolvedOpening = { opening: PlanOpening; wall: Wall; offset: number; width: number };

export function wallLength(room: Pick<FloorPlanRoom, "lengthFt" | "widthFt">, wall: Wall): number {
  return wall === "top" || wall === "bottom" ? room.lengthFt : room.widthFt;
}

/**
 * Where each door/window is drawn. Openings placed on the plan keep their wall and
 * position; the rest are spread automatically — windows on outside walls, doors
 * preferring walls shared with another room, never on open sides.
 */
export function resolveOpenings(room: FloorPlanRoom, shared: Set<Wall>): ResolvedOpening[] {
  const resolved: ResolvedOpening[] = [];
  const walled = WALLS.filter((w) => !room.openWalls.includes(w));

  for (const o of room.openings) {
    if (!o.wall) continue;
    const len = wallLength(room, o.wall);
    const width = Math.min(o.widthFt > 0 ? o.widthFt : o.type === "door" ? 3 : 4, len - 0.2);
    if (width < 0.5) continue;
    resolved.push({ opening: o, wall: o.wall, width, offset: Math.min(Math.max(o.offset ?? 0, 0.1), len - width - 0.1) });
  }

  const doorOrder = (["bottom", "right", "left", "top"] as Wall[]).filter((w) => walled.includes(w));
  const doorWalls = [...doorOrder.filter((w) => shared.has(w)), ...doorOrder.filter((w) => !shared.has(w))];
  const windowCandidates = (["top", "left", "right", "bottom"] as Wall[]).filter((w) => walled.includes(w));
  const outside = windowCandidates.filter((w) => !shared.has(w));
  const windowWalls = outside.length > 0 ? outside : windowCandidates;

  for (const [type, order, fallback] of [
    ["door", doorWalls, 3],
    ["window", windowWalls, 4],
  ] as const) {
    if (order.length === 0) continue;
    const auto = room.openings.filter((o) => !o.wall && o.type === type);
    const byWall = new Map<Wall, PlanOpening[]>();
    auto.forEach((o, i) => {
      const wall = order[i % order.length];
      byWall.set(wall, [...(byWall.get(wall) ?? []), o]);
    });
    for (const [wall, list] of byWall) {
      const len = wallLength(room, wall);
      const widest = Math.max(...list.map((o) => (o.widthFt > 0 ? o.widthFt : fallback)));
      const width = Math.min(widest, type === "door" ? 4 : Infinity, len / list.length - 0.8);
      if (width < (type === "door" ? 1.5 : 0.8)) continue;
      const gap = (len - width * list.length) / (list.length + 1);
      list.forEach((o, k) => {
        const offset = type === "door" ? 0.4 + k * (width + 0.8) : gap + k * (width + gap);
        resolved.push({ opening: o, wall, offset, width });
      });
    }
  }
  return resolved;
}

/** Where a door/window cuts a wall on the plan: an axis-aligned span plus its height band in feet. */
export type OpeningSpan = {
  id: string;
  type: "door" | "window";
  horizontal: boolean;
  /** y of a horizontal wall, x of a vertical one. */
  at: number;
  from: number;
  to: number;
  sill: number;
  top: number;
};

function wallFramePoint(room: FloorPlanRoom, wall: Wall, along: number): { x: number; y: number } {
  const L = room.lengthFt;
  const W = room.widthFt;
  switch (wall) {
    case "top":
      return localToPlan(room, along, 0);
    case "right":
      return localToPlan(room, L, along);
    case "bottom":
      return localToPlan(room, L - along, W);
    case "left":
      return localToPlan(room, 0, W - along);
  }
}

export function openingSpans(rooms: FloorPlanRoom[]): OpeningSpan[] {
  return rooms.flatMap((room) =>
    resolveOpenings(room, sharedWalls(room, rooms)).map(({ opening, wall, offset, width }) => {
      const a = wallFramePoint(room, wall, offset);
      const b = wallFramePoint(room, wall, offset + width);
      const horizontal = Math.abs(a.y - b.y) < 1e-6;
      const maxTop = room.heightFt - 0.5;
      const full = opening.type === "window" && opening.fullHeight;
      const sill = opening.type === "door" || full ? 0 : Math.min(3, maxTop - 1);
      const top = full
        ? room.heightFt
        : Math.min(sill + (opening.heightFt > 0 ? opening.heightFt : opening.type === "door" ? 7 : 4), maxTop);
      return {
        id: opening.id,
        type: opening.type,
        horizontal,
        at: horizontal ? a.y : a.x,
        from: horizontal ? Math.min(a.x, b.x) : Math.min(a.y, b.y),
        to: horizontal ? Math.max(a.x, b.x) : Math.max(a.y, b.y),
        sill,
        top,
      };
    })
  );
}

/** Converts a movement on the plan into movement along one of the room's own walls. */
export function alongWall(dx: number, dy: number, room: Pick<FloorPlanRoom, "rotation">, wall: Wall): number {
  const local = toLocalDelta(dx, dy, room.rotation);
  switch (wall) {
    case "top":
      return local.dx;
    case "right":
      return local.dy;
    case "bottom":
      return -local.dx;
    case "left":
      return -local.dy;
  }
}

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

/** A point in the room's own frame → plan (world) feet. */
export function localToPlan(room: FloorPlanRoom, lx: number, ly: number): { x: number; y: number } {
  const L = room.lengthFt;
  const W = room.widthFt;
  switch (room.rotation) {
    case 90:
      return { x: room.x + W - ly, y: room.y + lx };
    case 180:
      return { x: room.x + L - lx, y: room.y + W - ly };
    case 270:
      return { x: room.x + ly, y: room.y + L - lx };
    default:
      return { x: room.x + lx, y: room.y + ly };
  }
}

/** A plan (world) point → the room's own frame. */
export function planToLocal(room: FloorPlanRoom, px: number, py: number): { x: number; y: number } {
  const L = room.lengthFt;
  const W = room.widthFt;
  const dx = px - room.x;
  const dy = py - room.y;
  switch (room.rotation) {
    case 90:
      return { x: dy, y: W - dx };
    case 180:
      return { x: L - dx, y: W - dy };
    case 270:
      return { x: L - dy, y: dx };
    default:
      return { x: dx, y: dy };
  }
}

export function containsPoint(room: FloorPlanRoom, px: number, py: number): boolean {
  const { w, h } = footprint(room);
  return px >= room.x && px <= room.x + w && py >= room.y && py <= room.y + h;
}

/**
 * Moves a furniture item into another room, keeping where it sits on the plan and
 * which way it faces.
 */
export function transferItem(item: FurnitureItem, from: FloorPlanRoom, to: FloorPlanRoom): FurnitureItem {
  const f = footprint(item);
  const center = localToPlan(from, item.x + f.w / 2, item.y + f.h / 2);
  const rotation = (((from.rotation + item.rotation - to.rotation) % 360) + 360) % 360 as PlanRotation;
  const moved = { ...item, rotation };
  const g = footprint(moved);
  const local = planToLocal(to, center.x, center.y);
  return clampItem({ ...moved, x: local.x - g.w / 2, y: local.y - g.h / 2 }, to);
}

/** Passages are paving around/between rooms: they never cut another room's walls. */
export const isPassage = (room: Pick<FloorPlanRoom, "category">) => room.category === "passage";

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

export const MIN_ITEM_FT = 0.5;

/** Sets an item's own width/depth, keeping it within the room and its top-left corner in place. */
export function resizeItem(item: FurnitureItem, room: Pick<FloorPlanRoom, "lengthFt" | "widthFt">, w: number, h: number): FurnitureItem {
  const turned = item.rotation === 90 || item.rotation === 270;
  const maxW = turned ? room.widthFt : room.lengthFt;
  const maxH = turned ? room.lengthFt : room.widthFt;
  const sized = {
    ...item,
    w: Math.min(Math.max(w, MIN_ITEM_FT), maxW),
    h: Math.min(Math.max(h, MIN_ITEM_FT), maxH),
  };
  return clampItem(sized, room);
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
    case "garage": {
      if (W < 15 || L < 7) return [];
      const cars = Math.min(3, Math.floor((L - 1) / 8));
      const gap = (L - cars * 6) / (cars + 1);
      return Array.from({ length: Math.max(1, cars) }, (_, i) =>
        item(`car-${i + 1}`, "car", gap + i * (6 + gap), (W - 14.5) / 2, 6, 14.5)
      );
    }
    case "staircase": {
      if (L < 3 || W < 6) return [];
      return [item("stairs", "stairs", 0.2, 0.2, Math.min(L - 0.4, 4), W - 0.4)];
    }
    case "drawing_room": {
      if (L < 8 || W < 7) return [];
      const sofaLen = Math.min(7, W - 2);
      const rugH = Math.min(6, W - 1);
      return [
        item("rug", "rug", 1.2, (W - rugH) / 2, Math.min(6, L - 2.8), rugH),
        item("sofa", "sofa", 0.3, (W - sofaLen) / 2, sofaLen, 2.8, 270),
        item("coffee-table", "coffee_table", 4, W / 2 - 1.5, 3, 2.2, 90),
        ...(L >= 11 ? [item("armchair", "armchair", L - 3, W / 2 - 1.3, 2.6, 2.6, 90)] : []),
      ];
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
export function itemPlanRect(room: FloorPlanRoom, item: FurnitureItem): Rect {
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
 * whose label box doesn't sit on furniture of any room (rugs don't count), else the centre.
 */
export function labelAnchor(room: FloorPlanRoom, labelW: number, labelH: number, rooms: FloorPlanRoom[] = [room]): { x: number; y: number } {
  const { w, h } = footprint(room);
  const blockers = rooms.flatMap((r) => r.furniture.filter((f) => f.type !== "rug").map((f) => itemPlanRect(r, f)));
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

export const WALLS = PLAN_WALLS;
export type Wall = (typeof WALLS)[number];

/** Own-frame wall → the side of the plan it faces after the room's rotation. */
export function toPlanSide(wall: Wall, rotation: PlanRotation): Wall {
  return WALLS[(WALLS.indexOf(wall) + rotation / 90) % 4];
}

export function toOwnWall(side: Wall, rotation: PlanRotation): Wall {
  return WALLS[(WALLS.indexOf(side) - rotation / 90 + 4) % 4];
}

export type WallSegment = { x1: number; y1: number; x2: number; y2: number; roomId: string };

const WALL_TOLERANCE_FT = 0.1;

function sideLine(r: Rect, side: Wall) {
  switch (side) {
    case "top":
      return { horizontal: true, at: r.y, from: r.x, to: r.x + r.w };
    case "bottom":
      return { horizontal: true, at: r.y + r.h, from: r.x, to: r.x + r.w };
    case "left":
      return { horizontal: false, at: r.x, from: r.y, to: r.y + r.h };
    case "right":
      return { horizontal: false, at: r.x + r.w, from: r.y, to: r.y + r.h };
  }
}

function subtract(spans: [number, number][], cut: [number, number]): [number, number][] {
  return spans.flatMap(([a, b]) => {
    const [c, d] = cut;
    if (d <= a || c >= b) return [[a, b]];
    const out: [number, number][] = [];
    if (c > a) out.push([a, c]);
    if (d < b) out.push([d, b]);
    return out;
  });
}

type PlanLine = { horizontal: boolean; at: number; from: number; to: number };

/** A removed wall piece, in plan coordinates. */
export function wallGapLine(room: FloorPlanRoom, gap: WallGap): PlanLine {
  const L = room.lengthFt;
  const W = room.widthFt;
  const [a, b] =
    gap.wall === "top"
      ? [localToPlan(room, gap.from, 0), localToPlan(room, gap.to, 0)]
      : gap.wall === "bottom"
        ? [localToPlan(room, gap.from, W), localToPlan(room, gap.to, W)]
        : gap.wall === "left"
          ? [localToPlan(room, 0, gap.from), localToPlan(room, 0, gap.to)]
          : [localToPlan(room, L, gap.from), localToPlan(room, L, gap.to)];
  const horizontal = Math.abs(a.y - b.y) < 1e-6;
  return horizontal
    ? { horizontal, at: a.y, from: Math.min(a.x, b.x), to: Math.max(a.x, b.x) }
    : { horizontal, at: a.x, from: Math.min(a.y, b.y), to: Math.max(a.y, b.y) };
}

/** Ids of doors/windows whose middle sits on a removed wall piece — they go with the wall. */
export function openingsOnRemovedWalls(rooms: FloorPlanRoom[]): Set<string> {
  const gaps = rooms.flatMap((room) => (room.wallGaps ?? []).map((g) => wallGapLine(room, g)));
  if (gaps.length === 0) return new Set();
  return new Set(
    openingSpans(rooms)
      .filter((o) => {
        const mid = (o.from + o.to) / 2;
        return gaps.some(
          (g) => g.horizontal === o.horizontal && Math.abs(g.at - o.at) < 0.2 && mid >= g.from - 0.01 && mid <= g.to + 0.01
        );
      })
      .map((o) => o.id)
  );
}

/**
 * The piece of a drawn wall around a clicked point: it runs between the nearest places
 * where another room's wall meets this one (or the segment's own ends).
 */
export function wallPieceAt(rooms: FloorPlanRoom[], seg: WallSegment, px: number, py: number): PlanLine {
  const horizontal = seg.y1 === seg.y2;
  const at = horizontal ? seg.y1 : seg.x1;
  const from = horizontal ? Math.min(seg.x1, seg.x2) : Math.min(seg.y1, seg.y2);
  const to = horizontal ? Math.max(seg.x1, seg.x2) : Math.max(seg.y1, seg.y2);
  const p = horizontal ? px : py;
  let lo = from;
  let hi = to;
  for (const room of rooms) {
    if (isPassage(room)) continue;
    const { w, h } = footprint(room);
    const [near, far, edges] = horizontal ? [room.y, room.y + h, [room.x, room.x + w]] : [room.x, room.x + w, [room.y, room.y + h]];
    if (at < near - WALL_TOLERANCE_FT || at > far + WALL_TOLERANCE_FT) continue;
    for (const e of edges) {
      if (e > lo + 0.05 && e <= p) lo = e;
      if (e < hi - 0.05 && e >= p) hi = e;
    }
  }
  return { horizontal, at, from: lo, to: hi };
}

/** A plan-coordinate wall piece → a gap on one of the room's own walls, or null if it isn't on one. */
export function toWallGap(room: FloorPlanRoom, piece: PlanLine): WallGap | null {
  const a = planToLocal(room, piece.horizontal ? piece.from : piece.at, piece.horizontal ? piece.at : piece.from);
  const b = planToLocal(room, piece.horizontal ? piece.to : piece.at, piece.horizontal ? piece.at : piece.to);
  const near = (u: number, v: number) => Math.abs(u - v) < 0.05;
  const round = (n: number) => Math.round(n * 100) / 100;
  const span = (u: number, v: number) => ({ from: round(Math.max(0, Math.min(u, v))), to: round(Math.max(u, v)) });
  if (near(a.y, 0) && near(b.y, 0)) return { wall: "top", ...span(a.x, b.x) };
  if (near(a.y, room.widthFt) && near(b.y, room.widthFt)) return { wall: "bottom", ...span(a.x, b.x) };
  if (near(a.x, 0) && near(b.x, 0)) return { wall: "left", ...span(a.y, b.y) };
  if (near(a.x, room.lengthFt) && near(b.x, room.lengthFt)) return { wall: "right", ...span(a.y, b.y) };
  return null;
}

/**
 * The walls actually drawn on the plan. A wall is left out where its side is marked
 * open, where it runs through another room (rooms dragged over each other merge into
 * one space), where it lines up with a neighbouring room's open side, and where a
 * piece of it (or of a wall lying on it) was removed.
 */
export function wallSegments(rooms: FloorPlanRoom[]): WallSegment[] {
  const rects = rooms.map((room) => ({
    room,
    rect: { x: room.x, y: room.y, ...footprint(room) },
    openSides: new Set(room.openWalls.map((w) => toPlanSide(w, room.rotation))),
  }));
  const gaps = rooms.flatMap((room) => (room.wallGaps ?? []).map((g) => wallGapLine(room, g)));
  const segments: WallSegment[] = [];

  for (const a of rects) {
    for (const side of WALLS) {
      if (a.openSides.has(side)) continue;
      const line = sideLine(a.rect, side);
      let spans: [number, number][] = [[line.from, line.to]];

      for (const b of rects) {
        if (b === a || isPassage(b.room)) continue;
        const r = b.rect;
        const [lo, hi] = line.horizontal ? [r.y, r.y + r.h] : [r.x, r.x + r.w];
        const span: [number, number] = line.horizontal ? [r.x, r.x + r.w] : [r.y, r.y + r.h];
        const throughInterior = line.at > lo + WALL_TOLERANCE_FT && line.at < hi - WALL_TOLERANCE_FT;
        const onOpenNeighbourSide = (WALLS.filter((s) => b.openSides.has(s)) as Wall[]).some((s) => {
          const other = sideLine(r, s);
          return other.horizontal === line.horizontal && Math.abs(other.at - line.at) < WALL_TOLERANCE_FT;
        });
        if (throughInterior || onOpenNeighbourSide) spans = subtract(spans, span);
      }
      for (const g of gaps) {
        if (g.horizontal === line.horizontal && Math.abs(g.at - line.at) < WALL_TOLERANCE_FT) spans = subtract(spans, [g.from, g.to]);
      }

      for (const [from, to] of spans) {
        if (to - from < 0.05) continue;
        segments.push(
          line.horizontal
            ? { x1: from, y1: line.at, x2: to, y2: line.at, roomId: a.room.id }
            : { x1: line.at, y1: from, x2: line.at, y2: to, roomId: a.room.id }
        );
      }
    }
  }
  return segments;
}

/**
 * Which of a room's own (local, pre-rotation) walls are shared with another room
 * for at least half their length — i.e. inside walls, where windows don't belong.
 */
export function sharedWalls(room: FloorPlanRoom, rooms: FloorPlanRoom[]): Set<Wall> {
  const a = { ...footprint(room), x: room.x, y: room.y };
  const shared = new Set<Wall>();
  const touch = 0.15;
  for (const other of rooms) {
    if (other.id === room.id || isPassage(other)) continue;
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

/** Lays rooms out in rows (largest first), starting at startY, unrotated. */
export function autoArrange(rooms: FloorPlanRoom[], startY = 0): FloorPlanRoom[] {
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
