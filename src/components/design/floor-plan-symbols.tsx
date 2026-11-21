import type { ReactNode } from "react";
import { formatFeetInches, rotationTransform, type FloorPlanRoom, type Wall } from "@/lib/calculations/floor-plan";
import type { FloorMaterial, FurnitureItem, PlanPassage } from "@/lib/validations/floor-plan";

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

export type FloorKind = FloorMaterial;

/** The room's chosen floor material, or the default for its type. */
export function floorKind(room: Pick<FloorPlanRoom, "category" | "floorMaterial">): FloorKind {
  if (room.floorMaterial) return room.floorMaterial;
  switch (room.category) {
    case "master_bedroom":
    case "bedroom_2":
    case "bedroom_3":
    case "staircase":
      return "wood";
    case "bathroom":
    case "utility":
      return "wetTile";
    case "balcony":
    case "porch":
      return "stone";
    case "garage":
      return "concrete";
    case "passage":
      return "paver";
    default:
      return "tile";
  }
}

export const FLOOR_FILL: Record<FloorKind, string> = {
  wood: "url(#floor-wood)",
  walnut: "url(#floor-walnut)",
  marble: "url(#floor-marble)",
  granite: "url(#floor-granite)",
  carpet: "url(#floor-carpet)",
  tile: "url(#floor-tile)",
  wetTile: "url(#floor-wet)",
  stone: "url(#floor-stone)",
  concrete: "url(#floor-concrete)",
  paver: "url(#floor-paver)",
};

const FLOOR_BASE: Record<FloorKind, string> = {
  wood: "#c99b6b",
  walnut: "#6f4a2f",
  marble: "#f4f2ee",
  granite: "#3b3a3d",
  carpet: "#b9ad99",
  tile: "#f1ebe0",
  wetTile: "#c9cac7",
  stone: "#d6d3cc",
  concrete: "#8f949a",
  paver: "#8d9095",
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
      <pattern id="floor-walnut" width={4} height={1} patternUnits="userSpaceOnUse">
        <rect width={4} height={1} fill={FLOOR_BASE.walnut} />
        <rect y={0.5} width={4} height={0.5} fill="#664329" />
        <path d="M0 0.5H4M0 1H4M1.3 0V0.5M3.4 0V0.5M0.4 0.5V1M2.5 0.5V1" stroke="#4f331f" strokeWidth={0.02} />
      </pattern>
      <pattern id="floor-marble" width={4} height={4} patternUnits="userSpaceOnUse">
        <rect width={4} height={4} fill={FLOOR_BASE.marble} />
        <path d="M0 1.2C1 0.9 1.6 1.8 2.6 1.4S3.6 2.4 4 2.2M0.3 3.4C1.1 3 2 3.7 2.8 3.2" fill="none" stroke="#d9d4cb" strokeWidth={0.04} />
        <path d="M4 0H0V4" fill="none" stroke="#e6e1d8" strokeWidth={0.02} />
      </pattern>
      <pattern id="floor-granite" width={2} height={2} patternUnits="userSpaceOnUse">
        <rect width={2} height={2} fill={FLOOR_BASE.granite} />
        {[0.2, 0.7, 1.3, 1.7, 0.5, 1.1, 1.5, 0.9].map((v, i) => (
          <circle key={i} cx={(v * 7) % 2} cy={(v * 3 + i * 0.37) % 2} r={0.04} fill={i % 2 ? "#5d5b60" : "#26252a"} />
        ))}
        <path d="M2 0H0V2" fill="none" stroke="#2a292c" strokeWidth={0.03} />
      </pattern>
      <pattern id="floor-carpet" width={0.5} height={0.5} patternUnits="userSpaceOnUse">
        <rect width={0.5} height={0.5} fill={FLOOR_BASE.carpet} />
        <path d="M0 0.25H0.5M0.25 0V0.5" stroke="#ada08b" strokeWidth={0.015} opacity={0.5} />
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
      <pattern id="floor-concrete" width={6} height={6} patternUnits="userSpaceOnUse">
        <rect width={6} height={6} fill={FLOOR_BASE.concrete} />
        <path d="M6 0H0V6" fill="none" stroke="#7f848a" strokeWidth={0.04} />
      </pattern>
      <pattern id="floor-paver" width={1} height={1} patternUnits="userSpaceOnUse">
        <rect width={1} height={1} fill={FLOOR_BASE.paver} />
        <path d="M0 0H1M0 0.5H1M0.5 0V0.5M0 0.5V1M1 0.5V1" stroke="#76797e" strokeWidth={0.035} />
        <rect x={0.04} y={0.04} width={0.42} height={0.42} fill="#999ca1" />
        <rect x={0.54} y={0.54} width={0.42} height={0.42} fill="#878a8f" />
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
export function wallFrameTransform(wall: Wall, L: number, W: number): string {
  switch (wall) {
    case "top":
      return "";
    case "right":
      return `translate(${L} 0) rotate(90)`;
    case "bottom":
      return `translate(${L} ${W}) rotate(180)`;
    case "left":
      return `translate(0 ${W}) rotate(270)`;
  }
}

/**
 * One door or window drawn in its wall's frame (see wallFrameTransform), starting
 * `offset` feet along the wall. Doors open the wall onto the floor and show their
 * swing; windows are glazed strips set into the wall.
 */
export function OpeningShape({
  type,
  offset: o,
  width,
  swing,
  fullHeight = false,
  floor,
  selected,
}: {
  type: "door" | "window";
  offset: number;
  width: number;
  swing: 0 | 1 | 2 | 3;
  /** Floor-to-ceiling glazing: drawn as a framed glass panel with mullions instead of a sill window. */
  fullHeight?: boolean;
  floor: string;
  selected: boolean;
}) {
  const half = WALL_FT / 2;
  if (type === "window" && fullHeight) {
    const panes = Math.max(1, Math.round(width / 2.5));
    return (
      <>
        <rect x={o} y={-half} width={width} height={WALL_FT} fill="#cfe3ef" stroke="#4f6b7d" strokeWidth={0.035} />
        <line x1={o} y1={0} x2={o + width} y2={0} stroke="#4f6b7d" strokeWidth={0.04} />
        {Array.from({ length: panes - 1 }, (_, k) => {
          const x = o + ((k + 1) * width) / panes;
          return <line key={k} x1={x} y1={-half} x2={x} y2={half} stroke="#4f6b7d" strokeWidth={0.035} />;
        })}
        {selected && <SelectionBox x={o} y={-half} w={width} h={WALL_FT} />}
      </>
    );
  }
  if (type === "window") {
    return (
      <>
        <rect x={o} y={-half} width={width} height={WALL_FT} fill="#e9eef1" stroke="#8d969c" strokeWidth={0.025} />
        <line x1={o} y1={-half / 3} x2={o + width} y2={-half / 3} stroke="#9fb3c0" strokeWidth={0.03} />
        <line x1={o} y1={half / 3} x2={o + width} y2={half / 3} stroke="#9fb3c0" strokeWidth={0.03} />
        {selected && <SelectionBox x={o} y={-half} w={width} h={WALL_FT} />}
      </>
    );
  }
  const w = width;
  const hingeAtEnd = swing === 1 || swing === 2;
  const outward = swing === 2 || swing === 3;
  const hx = hingeAtEnd ? o + w : o;
  const dir = outward ? -1 : 1;
  // Leaf stands open at 90° from the hinge; the arc runs from its tip back to the far jamb.
  const arc = hingeAtEnd
    ? `M ${o} 0 A ${w} ${w} 0 0 ${outward ? 1 : 0} ${hx} ${dir * w}`
    : `M ${hx} ${dir * w} A ${w} ${w} 0 0 ${outward ? 1 : 0} ${o + w} 0`;
  return (
    <>
      <rect x={o} y={-half - 0.02} width={w} height={WALL_FT + 0.04} fill={floor} />
      <path d={arc} fill="none" stroke="#6b625a" strokeWidth={0.03} />
      <rect x={hx - 0.04} y={outward ? -w : 0} width={0.08} height={w} fill="#f7f4ee" stroke="#6b625a" strokeWidth={0.02} />
      {selected && <SelectionBox x={o} y={outward ? -w : -half} w={w} h={w + half} />}
    </>
  );
}

function SelectionBox({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <rect
      x={x - 0.12}
      y={y - 0.12}
      width={w + 0.24}
      height={h + 0.24}
      fill="none"
      stroke="#d97706"
      strokeWidth={0.06}
      strokeDasharray="0.25 0.15"
    />
  );
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
    case "armchair":
      return (
        <>
          <rect width={w} height={h} rx={0.3} fill={C.sofaDark} />
          <rect x={w * 0.18} y={h * 0.3} width={w * 0.64} height={h * 0.62} rx={0.2} fill={C.sofa} />
          <rect x={w * 0.35} y={h * 0.36} width={w * 0.3} height={w * 0.3} rx={0.1} fill={C.olive} />
        </>
      );
    case "bathtub":
      return (
        <>
          <rect width={w} height={h} rx={0.3} fill={C.ceramic} stroke={C.ceramicEdge} strokeWidth={0.03} />
          <rect x={0.25} y={0.25} width={w - 0.5} height={h - 0.5} rx={Math.min(0.8, h * 0.35)} fill="#e4ebef" stroke="#c4d0d7" strokeWidth={0.03} />
          <circle cx={w - 0.7} cy={h / 2} r={0.09} fill="#8d969c" />
        </>
      );
    case "shower": {
      const lines = Math.max(2, Math.round(w / 0.5));
      return (
        <>
          <rect width={w} height={h} fill="#dde2e5" />
          {Array.from({ length: lines - 1 }, (_, i) => (
            <g key={i} stroke="#c6cdd1" strokeWidth={0.02}>
              <line x1={((i + 1) * w) / lines} y1={0} x2={((i + 1) * w) / lines} y2={h} />
              <line x1={0} y1={((i + 1) * h) / lines} x2={w} y2={((i + 1) * h) / lines} />
            </g>
          ))}
          <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * 0.08} fill="#9aa3a9" />
          <rect width={w} height={h} fill="none" stroke="#9fb3c0" strokeWidth={0.05} strokeDasharray="0.2 0.1" />
        </>
      );
    }
    case "car": {
      const glass = "#3c4754";
      return (
        <>
          <rect x={w * 0.06} y={0} width={w * 0.88} height={h} rx={w * 0.3} fill="#e9eaec" stroke="#b5b9be" strokeWidth={0.04} />
          <rect x={-0.05} y={h * 0.3} width={0.35} height={0.25} rx={0.08} fill="#cfd2d6" />
          <rect x={w - 0.3} y={h * 0.3} width={0.35} height={0.25} rx={0.08} fill="#cfd2d6" />
          <path d={`M ${w * 0.18} ${h * 0.3} L ${w * 0.82} ${h * 0.3} L ${w * 0.76} ${h * 0.4} L ${w * 0.24} ${h * 0.4} Z`} fill={glass} />
          <rect x={w * 0.24} y={h * 0.41} width={w * 0.52} height={h * 0.32} rx={0.2} fill="#f4f5f6" stroke="#d5d8db" strokeWidth={0.03} />
          <path d={`M ${w * 0.24} ${h * 0.74} L ${w * 0.76} ${h * 0.74} L ${w * 0.8} ${h * 0.82} L ${w * 0.2} ${h * 0.82} Z`} fill={glass} />
          <line x1={w * 0.3} y1={h * 0.05} x2={w * 0.3} y2={h * 0.25} stroke="#d5d8db" strokeWidth={0.04} />
          <line x1={w * 0.7} y1={h * 0.05} x2={w * 0.7} y2={h * 0.25} stroke="#d5d8db" strokeWidth={0.04} />
        </>
      );
    }
    case "stairs": {
      const tread = 0.85;
      const steps = Math.max(2, Math.floor(h / tread));
      return (
        <>
          <rect width={w} height={h} fill="#b58152" />
          {Array.from({ length: steps - 1 }, (_, i) => (
            <line key={i} x1={0} y1={((i + 1) * h) / steps} x2={w} y2={((i + 1) * h) / steps} stroke="#8a5d37" strokeWidth={0.04} />
          ))}
          <rect width={w} height={h} fill="none" stroke="#6d4a2d" strokeWidth={0.06} />
          <line x1={w / 2} y1={h - 0.4} x2={w / 2} y2={0.6} stroke="#2b2b2b" strokeWidth={0.05} />
          <path d={`M ${w / 2} 0.35 l -0.25 0.4 h 0.5 Z`} fill="#2b2b2b" />
          <text x={w / 2} y={h - 0.15} fontSize={0.42} fontWeight={700} textAnchor="middle" fill="#2b2b2b" fontFamily="Arial, Helvetica, sans-serif">
            UP
          </text>
        </>
      );
    }
    case "partition": {
      // Vertical wooden slats (jali) with small gaps, seen from above.
      const slats = Math.max(2, Math.round(w / 0.35));
      const pitch = w / slats;
      return (
        <>
          <rect width={w} height={h} fill="#e8dccb" opacity={0.6} />
          {Array.from({ length: slats }, (_, i) => (
            <rect key={i} x={i * pitch + pitch * 0.15} y={0} width={pitch * 0.7} height={h} rx={0.03} fill={C.wood} />
          ))}
          <rect width={w} height={h} fill="none" stroke={C.woodDark} strokeWidth={0.04} />
        </>
      );
    }
    case "breakfast_counter": {
      // Counter top with bar stools along the long front side.
      const stools = Math.max(1, Math.floor(w / 1.8));
      return (
        <>
          {Array.from({ length: stools }, (_, i) => (
            <circle key={i} cx={((i + 0.5) * w) / stools} cy={h + 0.55} r={0.5} fill={C.chair} stroke={C.sofaDark} strokeWidth={0.04} />
          ))}
          <rect width={w} height={h} rx={0.08} fill={C.granite} />
          <rect x={0.08} y={0.08} width={w - 0.16} height={h - 0.16} rx={0.05} fill="none" stroke={C.graniteEdge} strokeWidth={0.04} />
        </>
      );
    }
    case "mandir": {
      // Wall-mounted pooja unit: wooden cabinet with a small dome outline and a diya.
      const r = Math.min(w, h) * 0.32;
      return (
        <>
          <rect width={w} height={h} rx={0.06} fill="#c9925a" stroke={C.woodDark} strokeWidth={0.04} />
          <rect x={0.12} y={0.12} width={w - 0.24} height={h - 0.24} rx={0.05} fill="none" stroke="#e7c27a" strokeWidth={0.05} />
          <path d={`M ${w / 2 - r} ${h / 2 + r * 0.4} A ${r} ${r} 0 0 1 ${w / 2 + r} ${h / 2 + r * 0.4} Z`} fill="#e7c27a" />
          <circle cx={w / 2} cy={h / 2 - r * 0.75} r={0.08} fill="#e7c27a" />
          <circle cx={w / 2} cy={h - 0.3} r={0.1} fill="#f08a24" />
        </>
      );
    }
  }
}

export type PlanBounds = { minX: number; minY: number; maxX: number; maxY: number };

export const HEDGE_FT = 1.4;

/** Paved passage around the building with a landscaped hedge border, like a site plan. */
export function PassageArea({ bounds, passage }: { bounds: PlanBounds; passage: PlanPassage }) {
  const x0 = bounds.minX - passage.left;
  const y0 = bounds.minY - passage.top;
  const x1 = bounds.maxX + passage.right;
  const y1 = bounds.maxY + passage.bottom;
  const strips: { side: keyof PlanPassage; x: number; y: number; w: number; h: number }[] = [
    { side: "top", x: x0, y: y0 - HEDGE_FT, w: x1 - x0, h: HEDGE_FT },
    { side: "bottom", x: x0, y: y1, w: x1 - x0, h: HEDGE_FT },
    { side: "left", x: x0 - HEDGE_FT, y: y0 - (passage.top > 0 ? HEDGE_FT : 0), w: HEDGE_FT, h: y1 - y0 + (passage.top > 0 ? HEDGE_FT : 0) + (passage.bottom > 0 ? HEDGE_FT : 0) },
    { side: "right", x: x1, y: y0 - (passage.top > 0 ? HEDGE_FT : 0), w: HEDGE_FT, h: y1 - y0 + (passage.top > 0 ? HEDGE_FT : 0) + (passage.bottom > 0 ? HEDGE_FT : 0) },
  ];
  const labels = [
    { side: "top" as const, x: (x0 + x1) / 2, y: y0 + passage.top / 2, rotate: 0 },
    { side: "bottom" as const, x: (x0 + x1) / 2, y: y1 - passage.bottom / 2, rotate: 0 },
    { side: "left" as const, x: x0 + passage.left / 2, y: (y0 + y1) / 2, rotate: -90 },
    { side: "right" as const, x: x1 - passage.right / 2, y: (y0 + y1) / 2, rotate: 90 },
  ];

  return (
    <g pointerEvents="none">
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={FLOOR_FILL.paver} />
      {strips
        .filter((s) => passage[s.side] > 0)
        .map((s) => {
          const along = Math.max(s.w, s.h);
          const count = Math.max(1, Math.round(along / 3.2));
          const horizontal = s.w >= s.h;
          return (
            <g key={s.side}>
              <rect x={s.x} y={s.y} width={s.w} height={s.h} fill="#6e8f4e" />
              {Array.from({ length: count }, (_, i) => {
                const t = (i + 0.5) / count;
                const cx = horizontal ? s.x + s.w * t : s.x + s.w / 2;
                const cy = horizontal ? s.y + s.h / 2 : s.y + s.h * t;
                return (
                  <g key={i} filter="url(#soft-shadow)">
                    <circle cx={cx} cy={cy} r={HEDGE_FT * 0.62} fill={i % 2 ? "#3f6b2f" : "#4f7d3a"} />
                    <circle cx={cx - 0.18} cy={cy - 0.18} r={HEDGE_FT * 0.32} fill="#6a9a4c" />
                  </g>
                );
              })}
            </g>
          );
        })}
      {labels
        .filter((l) => passage[l.side] >= 2)
        .map((l) => (
          <text
            key={l.side}
            x={l.x}
            y={l.y}
            dy={0.2}
            fontSize={Math.min(0.55, passage[l.side] * 0.16)}
            fontWeight={700}
            letterSpacing={0.05}
            textAnchor="middle"
            fill="#f3f3f1"
            fontFamily="Arial, Helvetica, sans-serif"
            transform={l.rotate ? `rotate(${l.rotate} ${l.x} ${l.y})` : undefined}
          >
            PASSAGE {formatFeetInches(passage[l.side])} WIDE
          </text>
        ))}
    </g>
  );
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
