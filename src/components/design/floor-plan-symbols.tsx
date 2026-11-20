import type { ReactNode } from "react";
import { rotationTransform, type FloorPlanRoom, type Wall } from "@/lib/calculations/floor-plan";
import type { FurnitureItem } from "@/lib/validations/floor-plan";

export const WALL_FT = 0.16;
export const WALL_COLOR = "#262626";
const LINE = "#3a3a3a";
const THIN = 0.03;
const WINDOW_COLOR = "#4a78a8";
const WINDOW_DEPTH = 0.26;

export function localTransform(room: FloorPlanRoom): string {
  return rotationTransform(room.lengthFt, room.widthFt, room.rotation);
}

/** Frame where the wall runs along +x from 0 to its length and the room interior is +y. */
function wallFrame(wall: Wall, L: number, W: number): { transform: string; length: number } {
  switch (wall) {
    case "top":
      return { transform: "", length: L };
    case "right":
      return { transform: `translate(${L} 0) rotate(90)`, length: W };
    case "bottom":
      return { transform: `translate(${L} ${W}) rotate(180)`, length: L };
    case "left":
      return { transform: `translate(0 ${W}) rotate(270)`, length: W };
  }
}

function assignToWalls(widths: number[], order: Wall[], fallbackWidth: number) {
  const byWall = new Map<Wall, number[]>();
  widths.forEach((w, i) => {
    const wall = order[i % order.length];
    byWall.set(wall, [...(byWall.get(wall) ?? []), w > 0 ? w : fallbackWidth]);
  });
  return byWall;
}

/** Puts the preferred walls first while keeping the base order within each group. */
function preferWalls(order: Wall[], preferred: (wall: Wall) => boolean): Wall[] {
  const first = order.filter(preferred);
  return first.length > 0 ? [...first, ...order.filter((w) => !preferred(w))] : order;
}

/**
 * Doors cut the wall and show their swing; windows sit in the wall as a thin double line.
 * Windows go on outside walls and doors favour walls shared with another room.
 */
export function RoomOpenings({ room, sharedWalls }: { room: FloorPlanRoom; sharedWalls: Set<Wall> }) {
  const L = room.lengthFt;
  const W = room.widthFt;
  const doorOrder = preferWalls(["bottom", "right", "left", "top"], (w) => sharedWalls.has(w));
  const outside = (["top", "left", "right", "bottom"] as Wall[]).filter((w) => !sharedWalls.has(w));
  const windowOrder = outside.length > 0 ? outside : (["top", "left", "right", "bottom"] as Wall[]);
  const doors = assignToWalls(room.doorWidthsFt, doorOrder, 3);
  const windows = assignToWalls(room.windowWidthsFt, windowOrder, 4);
  const nodes: ReactNode[] = [];

  for (const [wall, widths] of windows) {
    const { transform, length } = wallFrame(wall, L, W);
    const width = Math.min(Math.max(...widths), length / widths.length - 0.8);
    if (width < 0.8) continue;
    const gap = (length - width * widths.length) / (widths.length + 1);
    widths.forEach((_, k) => {
      const o = gap + k * (width + gap);
      nodes.push(
        <g key={`w-${wall}-${k}`} transform={transform}>
          <rect x={o} y={-WINDOW_DEPTH / 2} width={width} height={WINDOW_DEPTH} fill="#fff" stroke={WINDOW_COLOR} strokeWidth={THIN} />
          <line x1={o} y1={0} x2={o + width} y2={0} stroke={WINDOW_COLOR} strokeWidth={THIN} />
        </g>
      );
    });
  }

  for (const [wall, widths] of doors) {
    const { transform, length } = wallFrame(wall, L, W);
    const width = Math.min(Math.max(...widths), 4, length / widths.length - 0.8);
    if (width < 1.5) continue;
    widths.forEach((_, k) => {
      const o = 0.4 + k * (width + 0.8);
      nodes.push(
        <g key={`d-${wall}-${k}`} transform={transform}>
          <rect x={o} y={-WALL_FT / 2 - 0.02} width={width} height={WALL_FT + 0.04} fill="#fff" />
          <line x1={o} y1={0} x2={o} y2={width} stroke={LINE} strokeWidth={THIN * 1.5} />
          <path d={`M ${o} ${width} A ${width} ${width} 0 0 0 ${o + width} 0`} fill="none" stroke={LINE} strokeWidth={THIN} strokeDasharray="0.15 0.08" />
        </g>
      );
    });
  }

  return <>{nodes}</>;
}

export function RoomDecoration({ room }: { room: FloorPlanRoom }) {
  if (room.category !== "balcony") return null;
  return (
    <rect
      x={0.35}
      y={0.35}
      width={Math.max(0, room.lengthFt - 0.7)}
      height={Math.max(0, room.widthFt - 0.7)}
      fill="none"
      stroke={LINE}
      strokeWidth={THIN}
      strokeDasharray="0.3 0.2"
    />
  );
}

/** Plan-view symbol for one furniture item, drawn in its own w × h frame. */
export function FurnitureShape({ item }: { item: FurnitureItem }) {
  const { w, h } = item;
  const s = { fill: "#fff", stroke: LINE, strokeWidth: THIN } as const;

  switch (item.type) {
    case "bed":
      return (
        <g>
          <rect width={w} height={h} rx={0.12} {...s} />
          <rect x={0.25} y={0.25} width={w / 2 - 0.37} height={Math.min(1.1, h * 0.2)} rx={0.18} {...s} />
          <rect x={w / 2 + 0.12} y={0.25} width={w / 2 - 0.37} height={Math.min(1.1, h * 0.2)} rx={0.18} {...s} />
          <path d={`M 0 ${h * 0.33} L ${w} ${h * 0.33} M ${w * 0.55} ${h * 0.33} L ${w} ${h * 0.7}`} {...s} fill="none" />
        </g>
      );
    case "wardrobe":
      return (
        <g>
          <rect width={w} height={h} {...s} />
          <line x1={0} y1={h - 0.15} x2={w} y2={h - 0.15} stroke={LINE} strokeWidth={THIN} />
          <text x={w / 2} y={h / 2 + 0.12} fontSize={Math.min(0.36, h * 0.25)} textAnchor="middle" fill={LINE} fontFamily="Arial, Helvetica, sans-serif">
            Wardrobe
          </text>
        </g>
      );
    case "sofa": {
      const seat = w / 3;
      return (
        <g>
          <rect width={w} height={h} rx={0.2} {...s} />
          <rect width={w} height={h * 0.25} rx={0.15} {...s} />
          {[1, 2].map((i) => (
            <line key={i} x1={seat * i} y1={h * 0.25} x2={seat * i} y2={h} stroke={LINE} strokeWidth={THIN} />
          ))}
        </g>
      );
    }
    case "dining_set": {
      const tw = Math.max(1, h - 2.8);
      const chairs: ReactNode[] = [];
      for (let i = 0; i < 3; i++) {
        const cx = (w / 3) * i + w / 6 - 0.6;
        chairs.push(<rect key={`a${i}`} x={cx} y={0} width={1.2} height={1.1} rx={0.15} {...s} />);
        chairs.push(<rect key={`b${i}`} x={cx} y={h - 1.1} width={1.2} height={1.1} rx={0.15} {...s} />);
      }
      return (
        <g>
          {chairs}
          <rect x={0} y={1.4} width={w} height={tw} {...s} />
        </g>
      );
    }
    case "counter_l": {
      const d = Math.min(2, w / 2, h / 2);
      return <path d={`M 0 0 H ${w} V ${d} H ${d} V ${h} H 0 Z`} {...s} />;
    }
    case "sink":
      return (
        <g>
          <rect width={w} height={h} rx={0.1} {...s} />
          <rect x={0.2} y={0.2} width={w - 0.4} height={h - 0.4} rx={0.25} {...s} />
        </g>
      );
    case "hob":
      return (
        <g>
          <rect width={w} height={h} rx={0.08} {...s} />
          {[0.25, 0.75].flatMap((fy) =>
            [0.25, 0.75].map((fx) => <circle key={`${fx}${fy}`} cx={w * fx} cy={h * fy} r={Math.min(w, h) * 0.17} {...s} />)
          )}
        </g>
      );
    case "wc":
      return (
        <g>
          <rect width={w} height={h * 0.24} rx={0.08} {...s} />
          <ellipse cx={w / 2} cy={h * 0.6} rx={w * 0.4} ry={h * 0.36} {...s} />
        </g>
      );
    case "basin":
      return (
        <g>
          <rect width={w} height={h} rx={0.15} {...s} />
          <ellipse cx={w / 2} cy={h / 2} rx={w * 0.34} ry={h * 0.32} {...s} />
        </g>
      );
    case "washer":
      return (
        <g>
          <rect width={w} height={h} {...s} />
          <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * 0.34} {...s} />
        </g>
      );
    default:
      return <rect width={w} height={h} rx={0.08} {...s} />;
  }
}
