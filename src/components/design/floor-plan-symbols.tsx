import type { ReactNode } from "react";
import type { FloorPlanRoom } from "@/lib/calculations/floor-plan";

export const WALL_FT = 0.4;
const LINE = "#2b2b2b";
const THIN = 0.05;
const WINDOW_COLOR = "#4a78a8";

type Wall = "top" | "right" | "bottom" | "left";

/** Maps a room's local frame (length along x, width along y) into its rotated footprint. */
export function localTransform(room: FloorPlanRoom): string {
  const L = room.lengthFt;
  const W = room.widthFt;
  switch (room.rotation) {
    case 90:
      return `translate(${W} 0) rotate(90)`;
    case 180:
      return `translate(${L} ${W}) rotate(180)`;
    case 270:
      return `translate(0 ${L}) rotate(270)`;
    default:
      return "";
  }
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

/** Doors cut the wall and show their swing; windows sit in the wall as a thin double line. */
export function RoomOpenings({ room }: { room: FloorPlanRoom }) {
  const L = room.lengthFt;
  const W = room.widthFt;
  const doors = assignToWalls(room.doorWidthsFt, ["bottom", "right", "left", "top"], 3);
  const windows = assignToWalls(room.windowWidthsFt, ["top", "left", "right", "bottom"], 4);
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
          <rect x={o} y={-WALL_FT / 2} width={width} height={WALL_FT} fill="#fff" stroke={WINDOW_COLOR} strokeWidth={THIN} />
          <line x1={o} y1={-WALL_FT / 6} x2={o + width} y2={-WALL_FT / 6} stroke={WINDOW_COLOR} strokeWidth={THIN} />
          <line x1={o} y1={WALL_FT / 6} x2={o + width} y2={WALL_FT / 6} stroke={WINDOW_COLOR} strokeWidth={THIN} />
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
          <rect x={o} y={-WALL_FT / 2 - 0.03} width={width} height={WALL_FT + 0.06} fill="#fff" />
          <line x1={o} y1={0} x2={o} y2={width} stroke={LINE} strokeWidth={THIN * 1.4} />
          <path d={`M ${o} ${width} A ${width} ${width} 0 0 0 ${o + width} 0`} fill="none" stroke={LINE} strokeWidth={THIN} />
        </g>
      );
    });
  }

  return <>{nodes}</>;
}

/** Simple plan-view furniture so each room reads like a drafted layout. Local frame: L × W feet. */
export function RoomFurniture({ room }: { room: FloorPlanRoom }) {
  const L = room.lengthFt;
  const W = room.widthFt;
  const s = { fill: "#fff", stroke: LINE, strokeWidth: THIN } as const;

  switch (room.category) {
    case "master_bedroom":
    case "bedroom_2":
    case "bedroom_3": {
      if (L < 8 || W < 8) return null;
      const bedW = Math.min(room.category === "master_bedroom" ? 6 : 5, L - 3.5);
      const bedH = Math.min(6.5, W - 2.5);
      const bx = (L - bedW) / 2;
      const by = 0.4;
      return (
        <g>
          <rect x={bx} y={by} width={bedW} height={bedH} rx={0.15} {...s} />
          <rect x={bx + 0.3} y={by + 0.3} width={bedW / 2 - 0.45} height={1.1} rx={0.2} {...s} />
          <rect x={bx + bedW / 2 + 0.15} y={by + 0.3} width={bedW / 2 - 0.45} height={1.1} rx={0.2} {...s} />
          <path d={`M ${bx} ${by + 2.2} L ${bx + bedW} ${by + 2.2} M ${bx + bedW * 0.55} ${by + 2.2} L ${bx + bedW} ${by + bedH * 0.7}`} {...s} fill="none" />
          <rect x={bx - 1.6} y={by} width={1.4} height={1.4} {...s} />
          <rect x={bx + bedW + 0.2} y={by} width={1.4} height={1.4} {...s} />
          {L >= 11 && W >= 10 && (
            <g>
              <rect x={0.2} y={W - 2.2} width={Math.min(6, L - 4.5)} height={2} {...s} />
              <text x={0.2 + Math.min(6, L - 4.5) / 2} y={W - 1.05} fontSize={0.38} textAnchor="middle" fill={LINE}>
                Wardrobe
              </text>
            </g>
          )}
        </g>
      );
    }
    case "living_room": {
      if (L < 8 || W < 7) return null;
      const sofaLen = Math.min(7, W - 2);
      const sy = (W - sofaLen) / 2;
      const seat = sofaLen / 3;
      return (
        <g>
          <rect x={0.3} y={sy} width={2.8} height={sofaLen} rx={0.2} {...s} />
          <rect x={0.3} y={sy} width={0.7} height={sofaLen} rx={0.15} {...s} />
          {[1, 2].map((i) => (
            <line key={i} x1={1} y1={sy + seat * i} x2={3.1} y2={sy + seat * i} stroke={LINE} strokeWidth={THIN} />
          ))}
          <rect x={4} y={W / 2 - 1.5} width={2.2} height={3} rx={0.1} {...s} />
          <rect x={L - 1.5} y={W / 2 - 2.5} width={1.2} height={5} {...s} />
        </g>
      );
    }
    case "dining_room": {
      if (L < 6 || W < 6) return null;
      const alongX = L >= W;
      const tl = Math.min(6, (alongX ? L : W) - 2.5);
      const tw = 3;
      const tx = alongX ? (L - tl) / 2 : (L - tw) / 2;
      const ty = alongX ? (W - tw) / 2 : (W - tl) / 2;
      const chairs: ReactNode[] = [];
      for (let i = 0; i < 3; i++) {
        const along = (tl / 3) * i + tl / 6 - 0.6;
        if (alongX) {
          chairs.push(<rect key={`a${i}`} x={tx + along} y={ty - 1.4} width={1.2} height={1.1} rx={0.15} {...s} />);
          chairs.push(<rect key={`b${i}`} x={tx + along} y={ty + tw + 0.3} width={1.2} height={1.1} rx={0.15} {...s} />);
        } else {
          chairs.push(<rect key={`a${i}`} x={tx - 1.4} y={ty + along} width={1.1} height={1.2} rx={0.15} {...s} />);
          chairs.push(<rect key={`b${i}`} x={tx + tw + 0.3} y={ty + along} width={1.1} height={1.2} rx={0.15} {...s} />);
        }
      }
      return (
        <g>
          {chairs}
          <rect x={tx} y={ty} width={alongX ? tl : tw} height={alongX ? tw : tl} {...s} />
        </g>
      );
    }
    case "kitchen": {
      if (L < 6 || W < 5) return null;
      const d = 2;
      return (
        <g>
          <path d={`M 0.2 0.2 H ${L - 0.2} V ${0.2 + d} H ${0.2 + d} V ${W - 0.2} H 0.2 Z`} {...s} />
          <rect x={L * 0.55} y={0.45} width={2.4} height={1.5} rx={0.1} {...s} />
          <rect x={L * 0.55 + 0.2} y={0.65} width={2} height={1.1} rx={0.25} {...s} />
          {[0, 1].flatMap((r) =>
            [0, 1].map((c) => <circle key={`${r}${c}`} cx={0.75 + c * 0.9} cy={W / 2 + r * 0.9} r={0.32} {...s} />)
          )}
        </g>
      );
    }
    case "bathroom": {
      if (L < 3.5 || W < 4) return null;
      return (
        <g>
          <rect x={0.4} y={0.3} width={1.6} height={0.6} rx={0.1} {...s} />
          <ellipse cx={1.2} cy={1.65} rx={0.65} ry={0.85} {...s} />
          <rect x={L - 1.9} y={0.3} width={1.6} height={1.2} rx={0.2} {...s} />
          <ellipse cx={L - 1.1} cy={0.9} rx={0.55} ry={0.4} {...s} />
        </g>
      );
    }
    case "utility": {
      if (L < 4 || W < 3) return null;
      return (
        <g>
          {[0, 1].map((i) => (
            <g key={i}>
              <rect x={0.3 + i * 2.4} y={0.3} width={2.2} height={2.2} {...s} />
              <circle cx={1.4 + i * 2.4} cy={1.4} r={0.75} {...s} />
            </g>
          ))}
        </g>
      );
    }
    case "balcony":
      return (
        <rect x={0.35} y={0.35} width={Math.max(0, L - 0.7)} height={Math.max(0, W - 0.7)} fill="none" stroke={LINE} strokeWidth={THIN} strokeDasharray="0.3 0.2" />
      );
    default:
      return null;
  }
}
