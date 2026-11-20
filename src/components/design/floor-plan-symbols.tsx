import type { ReactNode } from "react";
import { rotationTransform, type FloorPlanRoom, type Wall } from "@/lib/calculations/floor-plan";
import type { FurnitureItem } from "@/lib/validations/floor-plan";

export const WALL_FT = 0.32;
export const WALL_COLOR = "#3b3b3b";

const C = {
  wood: "#9c6b45",
  woodDark: "#7a4f30",
  woodLight: "#b98a5e",
  linen: "#f2ede3",
  pillow: "#d8d1c3",
  olive: "#7c8463",
  oliveLight: "#98a07f",
  sofa: "#ddd2bf",
  sofaDark: "#c8baa2",
  chair: "#d9d1c3",
  granite: "#34343a",
  graniteEdge: "#4a4a52",
  steel: "#c3c8cd",
  steelDark: "#9aa1a8",
  ceramic: "#fbfbfa",
  ceramicEdge: "#c9c9c6",
  leaf: "#4e7a3a",
  leafLight: "#6f9b4f",
  rug: "#e6ddcc",
  rugEdge: "#d5c8b0",
  line: "#5a5048",
};

export type FloorKind = "wood" | "tile" | "wetTile" | "stone";

export function floorKind(category: FloorPlanRoom["category"]): FloorKind {
  switch (category) {
    case "master_bedroom":
    case "bedroom_2":
    case "bedroom_3":
      return "wood";
    case "bathroom":
    case "utility":
      return "wetTile";
    case "balcony":
      return "stone";
    default:
      return "tile";
  }
}

export const FLOOR_FILL: Record<FloorKind, string> = {
  wood: "url(#floor-wood)",
  tile: "url(#floor-tile)",
  wetTile: "url(#floor-wet)",
  stone: "url(#floor-stone)",
};

const FLOOR_BASE: Record<FloorKind, string> = {
  wood: "#c99b6b",
  tile: "#f1ebe0",
  wetTile: "#c9cac7",
  stone: "#d6d3cc",
};

/** Floor textures and the soft furniture shadow, in feet units. */
export function PlanDefs() {
  return (
    <defs>
      <pattern id="floor-wood" width={4} height={1} patternUnits="userSpaceOnUse">
        <rect width={4} height={1} fill={FLOOR_BASE.wood} />
        <rect y={0.5} width={4} height={0.5} fill="#c3946a" />
        <path d="M0 0.5H4M0 1H4M1.3 0V0.5M3.4 0V0.5M0.4 0.5V1M2.5 0.5V1" stroke="#b07f55" strokeWidth={0.02} />
      </pattern>
      <pattern id="floor-tile" width={2} height={2} patternUnits="userSpaceOnUse">
        <rect width={2} height={2} fill={FLOOR_BASE.tile} />
        <path d="M2 0H0V2" fill="none" stroke="#e1d8c8" strokeWidth={0.03} />
      </pattern>
      <pattern id="floor-wet" width={1} height={1} patternUnits="userSpaceOnUse">
        <rect width={1} height={1} fill={FLOOR_BASE.wetTile} />
        <path d="M1 0H0V1" fill="none" stroke="#b4b5b2" strokeWidth={0.025} />
      </pattern>
      <pattern id="floor-stone" width={1.5} height={1.5} patternUnits="userSpaceOnUse">
        <rect width={1.5} height={1.5} fill={FLOOR_BASE.stone} />
        <path d="M1.5 0H0V1.5" fill="none" stroke="#c2beb5" strokeWidth={0.03} />
      </pattern>
      <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx={0.06} dy={0.1} stdDeviation={0.1} floodColor="#3a2a1a" floodOpacity={0.3} />
      </filter>
    </defs>
  );
}

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

function preferWalls(order: Wall[], preferred: (wall: Wall) => boolean): Wall[] {
  const first = order.filter(preferred);
  return first.length > 0 ? [...first, ...order.filter((w) => !preferred(w))] : order;
}

/**
 * Doors open the wall onto the room's floor and show their swing; windows are glazed
 * strips set into outside walls. Doors favour walls shared with another room.
 */
export function RoomOpenings({ room, sharedWalls }: { room: FloorPlanRoom; sharedWalls: Set<Wall> }) {
  const L = room.lengthFt;
  const W = room.widthFt;
  const floor = FLOOR_FILL[floorKind(room.category)];
  const doorOrder = preferWalls(["bottom", "right", "left", "top"], (w) => sharedWalls.has(w));
  const outside = (["top", "left", "right", "bottom"] as Wall[]).filter((w) => !sharedWalls.has(w));
  const windowOrder = outside.length > 0 ? outside : (["top", "left", "right", "bottom"] as Wall[]);
  const doors = assignToWalls(room.doorWidthsFt, doorOrder, 3);
  const windows = assignToWalls(room.windowWidthsFt, windowOrder, 4);
  const nodes: ReactNode[] = [];
  const half = WALL_FT / 2;

  for (const [wall, widths] of windows) {
    const { transform, length } = wallFrame(wall, L, W);
    const width = Math.min(Math.max(...widths), length / widths.length - 0.8);
    if (width < 0.8) continue;
    const gap = (length - width * widths.length) / (widths.length + 1);
    widths.forEach((_, k) => {
      const o = gap + k * (width + gap);
      nodes.push(
        <g key={`w-${wall}-${k}`} transform={transform}>
          <rect x={o} y={-half} width={width} height={WALL_FT} fill="#e9eef1" stroke="#8d969c" strokeWidth={0.025} />
          <line x1={o} y1={-half / 3} x2={o + width} y2={-half / 3} stroke="#9fb3c0" strokeWidth={0.03} />
          <line x1={o} y1={half / 3} x2={o + width} y2={half / 3} stroke="#9fb3c0" strokeWidth={0.03} />
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
          <rect x={o} y={-half - 0.02} width={width} height={WALL_FT + 0.04} fill={floor} />
          <path d={`M ${o} ${width} A ${width} ${width} 0 0 0 ${o + width} 0`} fill="none" stroke="#6b625a" strokeWidth={0.03} />
          <rect x={o - 0.04} y={0} width={0.08} height={width} fill="#f7f4ee" stroke="#6b625a" strokeWidth={0.02} />
        </g>
      );
    });
  }

  return <>{nodes}</>;
}

/** Top-down, rendered furniture drawn in its own w × h frame (top edge = against the wall). */
export function FurnitureShape({ item }: { item: FurnitureItem }) {
  const { w, h } = item;
  const shadow = item.type === "rug" ? undefined : "url(#soft-shadow)";
  return <g filter={shadow}>{renderItem(item.type, w, h)}</g>;
}

function renderItem(type: FurnitureItem["type"], w: number, h: number): ReactNode {
  switch (type) {
    case "bed": {
      const head = Math.min(0.35, h * 0.06);
      const pillowH = Math.min(1, h * 0.17);
      const blanketY = h * 0.42;
      return (
        <>
          <rect width={w} height={h} rx={0.15} fill={C.linen} stroke={C.ceramicEdge} strokeWidth={0.02} />
          <rect width={w} height={head} rx={0.08} fill={C.woodDark} />
          <rect x={0.25} y={head + 0.2} width={w / 2 - 0.37} height={pillowH} rx={0.2} fill={C.pillow} />
          <rect x={w / 2 + 0.12} y={head + 0.2} width={w / 2 - 0.37} height={pillowH} rx={0.2} fill={C.pillow} />
          <rect x={w * 0.35} y={head + 0.35} width={w * 0.3} height={pillowH * 0.7} rx={0.15} fill={C.olive} opacity={0.85} />
          <rect x={0.05} y={blanketY} width={w - 0.1} height={h - blanketY - 0.05} rx={0.12} fill={C.olive} />
          <rect x={0.05} y={blanketY} width={w - 0.1} height={0.45} rx={0.1} fill={C.oliveLight} />
        </>
      );
    }
    case "side_table":
      return (
        <>
          <rect width={w} height={h} rx={0.1} fill={C.wood} />
          <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * 0.28} fill="#f3e3c3" stroke="#d6bf94" strokeWidth={0.03} />
          <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * 0.08} fill="#b38b55" />
        </>
      );
    case "wardrobe": {
      const slats = Math.max(4, Math.round(w / 0.3));
      return (
        <>
          <rect width={w} height={h} fill={C.woodDark} />
          {Array.from({ length: slats - 1 }, (_, i) => (
            <line key={i} x1={((i + 1) * w) / slats} y1={0.05} x2={((i + 1) * w) / slats} y2={h - 0.05} stroke={C.woodLight} strokeWidth={0.04} />
          ))}
        </>
      );
    }
    case "sofa": {
      const back = h * 0.28;
      const seat = (w - 0.6) / 3;
      return (
        <>
          <rect width={w} height={h} rx={0.25} fill={C.sofaDark} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={0.3 + i * seat + 0.04} y={back} width={seat - 0.08} height={h - back - 0.1} rx={0.15} fill={C.sofa} />
          ))}
          <rect x={0.4} y={back + 0.1} width={0.75} height={0.75} rx={0.15} fill={C.olive} transform={`rotate(-12 ${0.78} ${back + 0.48})`} />
          <rect x={w - 1.15} y={back + 0.1} width={0.75} height={0.75} rx={0.15} fill={C.olive} transform={`rotate(12 ${w - 0.78} ${back + 0.48})`} />
        </>
      );
    }
    case "coffee_table":
      return (
        <>
          <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill={C.woodLight} />
          <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 0.12} ry={h / 2 - 0.12} fill="none" stroke={C.wood} strokeWidth={0.04} />
          {renderPlant(w / 2, h / 2, Math.min(w, h) * 0.2)}
        </>
      );
    case "tv_unit":
      return (
        <>
          <rect width={w} height={h} rx={0.05} fill={C.wood} />
          <rect x={w * 0.12} y={0.05} width={w * 0.76} height={Math.min(0.22, h * 0.25)} rx={0.03} fill="#1c1c1e" />
          <line x1={w / 3} y1={h * 0.4} x2={w / 3} y2={h - 0.05} stroke={C.woodDark} strokeWidth={0.03} />
          <line x1={(2 * w) / 3} y1={h * 0.4} x2={(2 * w) / 3} y2={h - 0.05} stroke={C.woodDark} strokeWidth={0.03} />
        </>
      );
    case "dining_set": {
      const tw = Math.max(1, h - 2.8);
      const chairs: ReactNode[] = [];
      for (let i = 0; i < 3; i++) {
        const cx = (w / 3) * i + w / 6 - 0.6;
        chairs.push(
          <g key={`a${i}`}>
            <rect x={cx} y={0.05} width={1.2} height={1.1} rx={0.3} fill={C.chair} />
            <rect x={cx + 0.1} y={0.05} width={1} height={0.3} rx={0.12} fill={C.sofaDark} />
          </g>,
          <g key={`b${i}`}>
            <rect x={cx} y={h - 1.15} width={1.2} height={1.1} rx={0.3} fill={C.chair} />
            <rect x={cx + 0.1} y={h - 0.35} width={1} height={0.3} rx={0.12} fill={C.sofaDark} />
          </g>
        );
      }
      return (
        <>
          {chairs}
          <rect x={0} y={1.4} width={w} height={tw} rx={0.08} fill={C.wood} />
          <rect x={0.08} y={1.48} width={w - 0.16} height={tw - 0.16} rx={0.05} fill="none" stroke={C.woodLight} strokeWidth={0.03} />
          {renderPlant(w / 2, 1.4 + tw / 2, Math.min(0.45, tw * 0.22))}
        </>
      );
    }
    case "study_table":
      return (
        <>
          <rect x={w / 2 - 0.6} y={h - 0.4} width={1.2} height={1.1} rx={0.3} fill={C.chair} />
          <rect width={w} height={h} rx={0.06} fill={C.wood} />
          <rect x={w * 0.15} y={0.25} width={w * 0.35} height={h * 0.35} rx={0.04} fill="#2b2b2e" />
        </>
      );
    case "counter_straight":
      return (
        <>
          <rect width={w} height={h} fill={C.granite} />
          <line x1={0} y1={h - 0.06} x2={w} y2={h - 0.06} stroke={C.graniteEdge} strokeWidth={0.05} />
        </>
      );
    case "counter_l": {
      const d = Math.min(2, w / 2, h / 2);
      return (
        <>
          <path d={`M 0 0 H ${w} V ${d} H ${d} V ${h} H 0 Z`} fill={C.granite} />
          <path d={`M ${w} ${d - 0.06} H ${d - 0.06} V ${h}`} fill="none" stroke={C.graniteEdge} strokeWidth={0.05} />
        </>
      );
    }
    case "sink":
      return (
        <>
          <rect width={w} height={h} rx={0.1} fill={C.steel} />
          <rect x={0.18} y={0.18} width={w - 0.36} height={h - 0.36} rx={0.22} fill={C.steelDark} />
          <circle cx={w / 2} cy={0.12} r={0.08} fill="#7d858c" />
        </>
      );
    case "hob":
      return (
        <>
          <rect width={w} height={h} rx={0.08} fill="#141416" />
          {[0.27, 0.73].flatMap((fy) =>
            [0.27, 0.73].map((fx) => (
              <g key={`${fx}${fy}`}>
                <circle cx={w * fx} cy={h * fy} r={Math.min(w, h) * 0.17} fill="none" stroke="#6d6d72" strokeWidth={0.04} />
                <circle cx={w * fx} cy={h * fy} r={Math.min(w, h) * 0.07} fill="#4a4a4f" />
              </g>
            ))
          )}
        </>
      );
    case "wc":
      return (
        <>
          <rect x={0.05} width={w - 0.1} height={h * 0.26} rx={0.1} fill={C.ceramic} stroke={C.ceramicEdge} strokeWidth={0.03} />
          <ellipse cx={w / 2} cy={h * 0.6} rx={w * 0.42} ry={h * 0.37} fill={C.ceramic} stroke={C.ceramicEdge} strokeWidth={0.03} />
          <ellipse cx={w / 2} cy={h * 0.62} rx={w * 0.26} ry={h * 0.24} fill="#eef0f0" />
        </>
      );
    case "basin":
      return (
        <>
          <rect width={w} height={h} rx={0.1} fill="#ebe7e0" stroke={C.ceramicEdge} strokeWidth={0.03} />
          <ellipse cx={w / 2} cy={h / 2 + 0.05} rx={w * 0.33} ry={h * 0.3} fill={C.ceramic} stroke={C.ceramicEdge} strokeWidth={0.03} />
          <circle cx={w / 2} cy={0.15} r={0.07} fill="#8d969c" />
        </>
      );
    case "washer":
      return (
        <>
          <rect width={w} height={h} rx={0.12} fill={C.ceramic} stroke={C.ceramicEdge} strokeWidth={0.03} />
          <circle cx={w / 2} cy={h / 2 + 0.1} r={Math.min(w, h) * 0.32} fill="#dfe3e6" stroke="#aab2b8" strokeWidth={0.04} />
          <rect x={0.2} y={0.12} width={w - 0.4} height={0.2} rx={0.05} fill="#d6dadd" />
        </>
      );
    case "rug":
      return (
        <>
          <rect width={w} height={h} rx={0.1} fill={C.rug} />
          <rect x={0.2} y={0.2} width={Math.max(0, w - 0.4)} height={Math.max(0, h - 0.4)} rx={0.08} fill="none" stroke={C.rugEdge} strokeWidth={0.06} />
        </>
      );
    case "plant":
      return renderPlant(w / 2, h / 2, Math.min(w, h) / 2);
  }
}

function renderPlant(cx: number, cy: number, r: number) {
  const leaves = 7;
  return (
    <g>
      {Array.from({ length: leaves }, (_, i) => {
        const a = (i / leaves) * Math.PI * 2;
        return (
          <ellipse
            key={i}
            cx={cx + Math.cos(a) * r * 0.5}
            cy={cy + Math.sin(a) * r * 0.5}
            rx={r * 0.5}
            ry={r * 0.22}
            transform={`rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * r * 0.5} ${cy + Math.sin(a) * r * 0.5})`}
            fill={i % 2 ? C.leaf : C.leafLight}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.22} fill="#3d6330" />
    </g>
  );
}

/** Architectural dimension line with end ticks, arrows and a centred label. */
export function DimensionLine({ x1, y1, x2, y2, label, vertical = false }: {
  x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean;
}) {
  const color = "#2b2b2b";
  const a = 0.35;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const arrows = vertical
    ? `M ${x1} ${y1} l ${-a / 3} ${a} h ${(2 * a) / 3} Z M ${x2} ${y2} l ${-a / 3} ${-a} h ${(2 * a) / 3} Z`
    : `M ${x1} ${y1} l ${a} ${-a / 3} v ${(2 * a) / 3} Z M ${x2} ${y2} l ${-a} ${-a / 3} v ${(2 * a) / 3} Z`;
  const ticks = vertical
    ? `M ${x1 - 0.3} ${y1} h 0.6 M ${x2 - 0.3} ${y2} h 0.6`
    : `M ${x1} ${y1 - 0.3} v 0.6 M ${x2} ${y2 - 0.3} v 0.6`;
  return (
    <g pointerEvents="none" fontFamily="Arial, Helvetica, sans-serif">
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={0.04} />
      <path d={ticks} stroke={color} strokeWidth={0.04} />
      <path d={arrows} fill={color} />
      <text
        x={mx}
        y={my}
        dy={vertical ? 0 : -0.25}
        fontSize={0.6}
        fontWeight={700}
        fill={color}
        textAnchor="middle"
        stroke="#fbf8f3"
        strokeWidth={0.25}
        paintOrder="stroke"
        transform={vertical ? `rotate(-90 ${mx} ${my}) translate(0 -0.25)` : undefined}
      >
        {label}
      </text>
    </g>
  );
}
