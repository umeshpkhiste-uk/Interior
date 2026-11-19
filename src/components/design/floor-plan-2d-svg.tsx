import { CATEGORICAL_SEQUENCE } from "@/components/charts/chart-colors";
import type { FloorPlanLayout } from "@/lib/data/floor-plan";

const WALL_FT = 0.2;
const OPENING_COLORS = { door: "#8B5A2B", window: "#2566A3", other: "#6b6b6b" };

/** Pure SVG render of an auto-packed floor plan; viewBox is in feet so it scales cleanly at any size. */
export function FloorPlan2DSvg({ layout }: { layout: FloorPlanLayout }) {
  const pad = 1.5;
  const viewW = layout.totalWidthFt + pad * 2;
  const viewH = layout.totalHeightFt + pad * 2;

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} className="h-auto w-full" role="img" aria-label="2D floor plan, auto-arranged to scale from room measurements">
      <rect x={0} y={0} width={viewW} height={viewH} fill="oklch(0.98 0.005 80)" />
      {layout.rooms.map((room, i) => {
        const x = room.x + pad;
        const y = room.y + pad;
        const color = CATEGORICAL_SEQUENCE[i % CATEGORICAL_SEQUENCE.length];
        const fontSize = Math.max(0.22, Math.min(0.4, Math.min(room.w, room.h) * 0.18));
        const doorCount = room.openings.find((o) => o.type === "door")?.quantity ?? 0;
        const windowCount = room.openings.find((o) => o.type === "window")?.quantity ?? 0;

        return (
          <g key={room.id}>
            <rect x={x} y={y} width={room.w} height={room.h} fill={`${color}1a`} stroke={color} strokeWidth={WALL_FT} />
            {renderOpeningTicks(x, y, room.w, "door", doorCount)}
            {renderOpeningTicks(x, y + room.h - 0.05, room.w, "window", windowCount)}
            <text x={x + room.w / 2} y={y + room.h / 2 - fontSize * 0.3} textAnchor="middle" fontSize={fontSize} fontWeight={600} fill="oklch(0.25 0.01 60)">
              {room.name}
            </text>
            <text x={x + room.w / 2} y={y + room.h / 2 + fontSize * 0.9} textAnchor="middle" fontSize={fontSize * 0.78} fill="oklch(0.45 0.01 60)">
              {room.lengthFt.toFixed(1)} × {room.widthFt.toFixed(1)} ft
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function renderOpeningTicks(x: number, y: number, width: number, type: "door" | "window", count: number) {
  if (count <= 0) return null;
  const tickWidth = Math.min(0.8, width / (count + 1));
  return Array.from({ length: count }).map((_, i) => {
    const tickX = x + ((i + 1) * width) / (count + 1) - tickWidth / 2;
    return <rect key={`${type}-${i}`} x={tickX} y={y - 0.05} width={tickWidth} height={0.1} fill={OPENING_COLORS[type]} />;
  });
}
