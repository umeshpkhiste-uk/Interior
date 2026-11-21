"use client";

import type { ReactNode } from "react";
// Registers react-three-fiber's <mesh>, <group>… JSX element types.
import type {} from "@react-three/fiber";
import type { FurnitureItem, WallDesignType } from "@/lib/validations/floor-plan";

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
  cabinet: "#e7e1d6",
  granite: "#34343a",
  steel: "#b9bfc5",
  ceramic: "#fbfbfa",
  rug: "#e6ddcc",
  leaf: "#4e7a3a",
  pot: "#b8794f",
  black: "#1c1c1e",
  glass: "#3c4754",
  car: "#e4e6e9",
  tyre: "#222226",
};

/** A box in the item's own top-down frame: (x, z) is its top-left corner, (w, d) its size, y its base — all feet. */
function Box({
  x,
  z,
  w,
  d,
  y = 0,
  h,
  color,
  roughness = 0.8,
  metalness = 0,
  opacity,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  y?: number;
  h: number;
  color: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
}) {
  if (w <= 0 || d <= 0 || h <= 0) return null;
  return (
    <mesh position={[x + w / 2, y + h / 2, z + d / 2]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        transparent={opacity !== undefined}
        opacity={opacity ?? 1}
      />
    </mesh>
  );
}

/** An upright (elliptical) cylinder centred at (cx, cz). */
function Cyl({
  cx,
  cz,
  rx,
  rz = rx,
  y = 0,
  h,
  color,
  roughness = 0.7,
}: {
  cx: number;
  cz: number;
  rx: number;
  rz?: number;
  y?: number;
  h: number;
  color: string;
  roughness?: number;
}) {
  return (
    <mesh position={[cx, y + h / 2, cz]} scale={[rx, 1, rz]} castShadow receiveShadow>
      <cylinderGeometry args={[1, 1, h, 28]} />
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  );
}

function Plant({ cx, cz, r, y = 0 }: { cx: number; cz: number; r: number; y?: number }) {
  return (
    <group position={[cx, y, cz]}>
      <mesh position={[0, r * 0.45, 0]} castShadow>
        <cylinderGeometry args={[r * 0.45, r * 0.35, r * 0.9, 20]} />
        <meshStandardMaterial color={C.pot} roughness={0.8} />
      </mesh>
      <mesh position={[0, r * 1.45, 0]} castShadow>
        <sphereGeometry args={[r * 0.75, 20, 16]} />
        <meshStandardMaterial color={C.leaf} roughness={0.9} />
      </mesh>
      <mesh position={[r * 0.3, r * 1.85, r * 0.2]} castShadow>
        <sphereGeometry args={[r * 0.45, 16, 12]} />
        <meshStandardMaterial color="#6f9b4f" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** A furniture item in 3D in its own frame (w along x, h along z), centred on the origin. */
export function Furniture3D({ item, roomHeight }: { item: FurnitureItem; roomHeight: number }) {
  const { w, h } = item;
  const parts: ReactNode = (() => {
    switch (item.type) {
      case "bed": {
        const head = Math.min(0.35, h * 0.06);
        return (
          <>
            <Box x={0} z={0} w={w} d={h} h={1} color={C.wood} />
            <Box x={0.1} z={head + 0.05} w={w - 0.2} d={h - head - 0.15} y={1} h={0.75} color={C.linen} />
            <Box x={0} z={0} w={w} d={head} h={3.4} color={C.woodDark} />
            <Box x={0.3} z={head + 0.2} w={w / 2 - 0.45} d={Math.min(1, h * 0.17)} y={1.75} h={0.35} color={C.pillow} />
            <Box x={w / 2 + 0.15} z={head + 0.2} w={w / 2 - 0.45} d={Math.min(1, h * 0.17)} y={1.75} h={0.35} color={C.pillow} />
            <Box x={0.05} z={h * 0.42} w={w - 0.1} d={h * 0.58 - 0.08} y={1.75} h={0.12} color={C.olive} />
            <Box x={0.05} z={h * 0.42} w={w - 0.1} d={0.45} y={1.87} h={0.06} color={C.oliveLight} />
          </>
        );
      }
      case "side_table":
        return (
          <>
            <Box x={0} z={0} w={w} d={h} h={1.9} color={C.wood} />
            <Cyl cx={w / 2} cz={h / 2} rx={Math.min(w, h) * 0.12} y={1.9} h={0.7} color="#b38b55" />
            <Cyl cx={w / 2} cz={h / 2} rx={Math.min(w, h) * 0.3} y={2.6} h={0.6} color="#f3e3c3" />
          </>
        );
      case "wardrobe":
        return (
          <>
            <Box x={0} z={0} w={w} d={h} h={Math.min(7, roomHeight - 0.5)} color={C.woodDark} />
            <Box x={0.08} z={h - 0.04} w={w - 0.16} d={0.06} y={0.3} h={Math.min(6.4, roomHeight - 1.1)} color={C.woodLight} />
          </>
        );
      case "sofa":
      case "armchair": {
        const back = h * 0.28;
        const arm = Math.min(0.45, w * 0.15);
        const seats = item.type === "sofa" ? 3 : 1;
        const seatW = (w - arm * 2) / seats;
        return (
          <>
            <Box x={0} z={0} w={w} d={h} h={1.2} color={C.sofaDark} />
            <Box x={0} z={0} w={w} d={back} y={1.2} h={1.5} color={C.sofaDark} />
            <Box x={0} z={0} w={arm} d={h} y={1.2} h={0.7} color={C.sofaDark} />
            <Box x={w - arm} z={0} w={arm} d={h} y={1.2} h={0.7} color={C.sofaDark} />
            {Array.from({ length: seats }, (_, i) => (
              <Box key={i} x={arm + i * seatW + 0.03} z={back} w={seatW - 0.06} d={h - back - 0.05} y={1.2} h={0.35} color={C.sofa} />
            ))}
            <Box x={arm + 0.1} z={back + 0.05} w={0.8} d={0.25} y={1.55} h={0.7} color={C.olive} />
            {seats > 1 && <Box x={w - arm - 0.9} z={back + 0.05} w={0.8} d={0.25} y={1.55} h={0.7} color={C.olive} />}
          </>
        );
      }
      case "coffee_table":
        return (
          <>
            <Cyl cx={w / 2} cz={h / 2} rx={w / 2} rz={h / 2} y={1.2} h={0.2} color={C.woodLight} />
            <Cyl cx={w / 2} cz={h / 2} rx={0.18} y={0} h={1.2} color={C.wood} />
            <Plant cx={w / 2} cz={h / 2} r={Math.min(w, h) * 0.16} y={1.4} />
          </>
        );
      case "tv_unit":
        return (
          <>
            <Box x={0} z={0} w={w} d={h} h={1.6} color={C.wood} />
            <Box x={w * 0.12} z={0.08} w={w * 0.76} d={0.1} y={1.9} h={Math.min(2.6, w * 0.42)} color={C.black} roughness={0.3} />
            <Box x={w / 2 - 0.3} z={0.15} w={0.6} d={0.3} y={1.6} h={0.3} color={C.black} />
          </>
        );
      case "dining_set": {
        const tw = Math.max(1, h - 2.8);
        const chairs: ReactNode[] = [];
        for (let i = 0; i < 3; i++) {
          const cx = (w / 3) * i + w / 6 - 0.6;
          chairs.push(
            <group key={`a${i}`}>
              <Box x={cx} z={0.1} w={1.2} d={1.1} h={1.5} color={C.chair} />
              <Box x={cx} z={0.05} w={1.2} d={0.2} y={1.5} h={1.6} color={C.sofaDark} />
            </group>,
            <group key={`b${i}`}>
              <Box x={cx} z={h - 1.2} w={1.2} d={1.1} h={1.5} color={C.chair} />
              <Box x={cx} z={h - 0.25} w={1.2} d={0.2} y={1.5} h={1.6} color={C.sofaDark} />
            </group>
          );
        }
        return (
          <>
            {chairs}
            <Box x={0} z={1.4} w={w} d={tw} y={2.35} h={0.15} color={C.wood} />
            {[
              [0.15, 1.55],
              [w - 0.35, 1.55],
              [0.15, 1.4 + tw - 0.35],
              [w - 0.35, 1.4 + tw - 0.35],
            ].map(([x, z], i) => (
              <Box key={i} x={x} z={z} w={0.2} d={0.2} h={2.35} color={C.woodDark} />
            ))}
            <Plant cx={w / 2} cz={1.4 + tw / 2} r={Math.min(0.4, tw * 0.2)} y={2.5} />
          </>
        );
      }
      case "study_table":
        return (
          <>
            <Box x={0} z={0} w={w} d={h} y={2.35} h={0.15} color={C.wood} />
            <Box x={0.1} z={0.1} w={0.2} d={h - 0.2} h={2.35} color={C.woodDark} />
            <Box x={w - 0.3} z={0.1} w={0.2} d={h - 0.2} h={2.35} color={C.woodDark} />
            <Box x={w * 0.2} z={0.2} w={w * 0.35} d={0.08} y={2.5} h={1.1} color={C.black} roughness={0.3} />
            <Box x={w / 2 - 0.6} z={h - 0.1} w={1.2} d={1.1} h={1.5} color={C.chair} />
            <Box x={w / 2 - 0.6} z={h + 0.8} w={1.2} d={0.2} y={1.5} h={1.4} color={C.sofaDark} />
          </>
        );
      case "counter_straight":
        return (
          <>
            <Box x={0} z={0} w={w} d={h} h={2.7} color={C.cabinet} />
            <Box x={0} z={0} w={w} d={h + 0.05} y={2.7} h={0.15} color={C.granite} roughness={0.35} />
          </>
        );
      case "counter_l": {
        const d = Math.min(2, w / 2, h / 2);
        return (
          <>
            <Box x={0} z={0} w={w} d={d} h={2.7} color={C.cabinet} />
            <Box x={0} z={d} w={d} d={h - d} h={2.7} color={C.cabinet} />
            <Box x={0} z={0} w={w} d={d + 0.05} y={2.7} h={0.15} color={C.granite} roughness={0.35} />
            <Box x={0} z={d} w={d + 0.05} d={h - d} y={2.7} h={0.15} color={C.granite} roughness={0.35} />
          </>
        );
      }
      case "sink":
        return (
          <>
            <Box x={0} z={0} w={w} d={h} y={2.86} h={0.04} color={C.steel} metalness={0.6} roughness={0.35} />
            <Box x={0.18} z={0.18} w={w - 0.36} d={h - 0.36} y={2.87} h={0.04} color="#8f979e" metalness={0.6} roughness={0.35} />
            <Cyl cx={w / 2} cz={0.15} rx={0.06} y={2.86} h={0.9} color="#8d969c" />
          </>
        );
      case "hob":
        return (
          <>
            <Box x={0} z={0} w={w} d={h} y={2.86} h={0.05} color={C.black} roughness={0.25} />
            {[0.27, 0.73].flatMap((fz) =>
              [0.27, 0.73].map((fx) => (
                <Cyl key={`${fx}${fz}`} cx={w * fx} cz={h * fz} rx={Math.min(w, h) * 0.15} y={2.91} h={0.04} color="#4a4a4f" />
              ))
            )}
          </>
        );
      case "wc":
        return (
          <>
            <Box x={0.05} z={0} w={w - 0.1} d={h * 0.26} h={2.6} color={C.ceramic} roughness={0.3} />
            <Cyl cx={w / 2} cz={h * 0.6} rx={w * 0.42} rz={h * 0.37} h={1.35} color={C.ceramic} roughness={0.3} />
          </>
        );
      case "basin":
        return (
          <>
            <Box x={0} z={0} w={w} d={h} h={2.6} color="#ebe7e0" />
            <Cyl cx={w / 2} cz={h / 2 + 0.05} rx={w * 0.33} rz={h * 0.3} y={2.6} h={0.15} color={C.ceramic} roughness={0.3} />
            <Box x={w * 0.2} z={0} w={w * 0.6} d={0.06} y={3.2} h={2} color="#cfd8dd" metalness={0.5} roughness={0.15} />
          </>
        );
      case "washer":
        return (
          <>
            <Box x={0} z={0} w={w} d={h} h={2.8} color={C.ceramic} roughness={0.4} />
            <mesh position={[w / 2, 1.4, h + 0.01]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[Math.min(w, 2.8) * 0.32, Math.min(w, 2.8) * 0.32, 0.04, 28]} />
              <meshStandardMaterial color="#9fa8b0" roughness={0.2} />
            </mesh>
          </>
        );
      case "rug":
        return <Box x={0} z={0} w={w} d={h} h={0.03} color={C.rug} roughness={1} />;
      case "plant":
        return <Plant cx={w / 2} cz={h / 2} r={Math.min(w, h) / 2} />;
      case "bathtub":
        return (
          <>
            <Box x={0} z={0} w={w} d={h} h={1.8} color={C.ceramic} roughness={0.3} />
            <Box x={0.25} z={0.25} w={w - 0.5} d={h - 0.5} y={1.4} h={0.42} color="#dbe6ec" roughness={0.2} />
          </>
        );
      case "shower":
        return (
          <>
            <Box x={0} z={0} w={w} d={h} h={0.15} color="#dde2e5" />
            <Box x={0} z={h - 0.05} w={w} d={0.05} h={6.5} color="#cfe3ee" opacity={0.35} roughness={0.05} />
            <Cyl cx={w / 2} cz={0.3} rx={0.25} y={6.4} h={0.06} color="#9aa3a9" />
          </>
        );
      case "car":
        return (
          <>
            <Box x={w * 0.06} z={0.3} w={w * 0.88} d={h - 0.6} y={0.8} h={1.7} color={C.car} metalness={0.3} roughness={0.35} />
            <Box x={w * 0.14} z={h * 0.3} w={w * 0.72} d={h * 0.45} y={2.5} h={1.25} color={C.car} metalness={0.3} roughness={0.35} />
            <Box x={w * 0.16} z={h * 0.28} w={w * 0.68} d={0.12} y={2.6} h={1.05} color={C.glass} roughness={0.1} />
            <Box x={w * 0.16} z={h * 0.74} w={w * 0.68} d={0.12} y={2.6} h={1.05} color={C.glass} roughness={0.1} />
            <Box x={w * 0.13} z={h * 0.36} w={0.08} d={h * 0.33} y={2.65} h={0.95} color={C.glass} roughness={0.1} />
            <Box x={w * 0.79} z={h * 0.36} w={0.08} d={h * 0.33} y={2.65} h={0.95} color={C.glass} roughness={0.1} />
            {[
              [w * 0.06, h * 0.2],
              [w * 0.94, h * 0.2],
              [w * 0.06, h * 0.78],
              [w * 0.94, h * 0.78],
            ].map(([cx, cz], i) => (
              <mesh key={i} position={[cx, 0.8, cz]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.8, 0.8, 0.6, 20]} />
                <meshStandardMaterial color={C.tyre} roughness={0.9} />
              </mesh>
            ))}
          </>
        );
      case "stairs": {
        const tread = 0.85;
        const steps = Math.max(2, Math.floor(h / tread));
        const riser = Math.min(0.6, (roomHeight - 0.5) / steps);
        return (
          <>
            {Array.from({ length: steps }, (_, i) => (
              <Box key={i} x={0} z={h - (i + 1) * (h / steps)} w={w} d={h / steps} h={(i + 1) * riser} color={i % 2 ? "#b58152" : "#a87447"} />
            ))}
          </>
        );
      }
      case "partition": {
        // Floor-to-ceiling wooden slats with gaps you can see through, on a base and top rail.
        const tall = roomHeight - 0.02;
        const slats = Math.max(2, Math.round(w / 0.35));
        const pitch = w / slats;
        return (
          <>
            <Box x={0} z={0} w={w} d={h} h={0.25} color={C.woodDark} />
            <Box x={0} z={0} w={w} d={h} y={tall - 0.25} h={0.25} color={C.woodDark} />
            {Array.from({ length: slats }, (_, i) => (
              <Box key={i} x={i * pitch + pitch * 0.15} z={h * 0.15} w={pitch * 0.7} d={h * 0.7} y={0.25} h={tall - 0.5} color={C.wood} />
            ))}
          </>
        );
      }
      case "breakfast_counter": {
        // Bar-height counter (3.5 ft) with stools in front of the long side.
        const stools = Math.max(1, Math.floor(w / 1.8));
        return (
          <>
            <Box x={0.1} z={0.15} w={w - 0.2} d={h - 0.4} h={3.35} color={C.cabinet} />
            <Box x={0} z={0} w={w} d={h} y={3.35} h={0.15} color={C.granite} roughness={0.35} />
            {Array.from({ length: stools }, (_, i) => (
              <group key={i}>
                <Cyl cx={((i + 0.5) * w) / stools} cz={h + 0.55} rx={0.07} h={2.3} color="#8d969c" />
                <Cyl cx={((i + 0.5) * w) / stools} cz={h + 0.55} rx={0.5} y={2.3} h={0.15} color={C.chair} />
              </group>
            ))}
          </>
        );
      }
      case "mandir": {
        // Pooja unit: drawer base, open shrine with gold back panel and a dome on top.
        const base = 2.4;
        const shrine = 2.6;
        const r = Math.min(w, h) * 0.38;
        return (
          <>
            <Box x={0} z={0} w={w} d={h} h={base} color="#c9925a" />
            <Box x={0.1} z={h - 0.02} w={w - 0.2} d={0.04} y={0.3} h={base - 0.6} color="#e7c27a" />
            <Box x={0} z={0} w={w} d={0.15} y={base} h={shrine} color="#a8743f" />
            <Box x={0.15} z={0.15} w={w - 0.3} d={0.04} y={base + 0.2} h={shrine - 0.4} color="#e7c27a" metalness={0.4} roughness={0.4} />
            <Box x={0} z={0} w={0.15} d={h} y={base} h={shrine} color="#a8743f" />
            <Box x={w - 0.15} z={0} w={0.15} d={h} y={base} h={shrine} color="#a8743f" />
            <Box x={0} z={0} w={w} d={h} y={base + shrine} h={0.2} color="#a8743f" />
            <mesh position={[w / 2, base + shrine + 0.2, h / 2]} castShadow>
              <sphereGeometry args={[r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#e7c27a" metalness={0.4} roughness={0.4} />
            </mesh>
            <Cyl cx={w / 2} cz={h * 0.6} rx={0.12} y={base} h={0.1} color="#f08a24" />
          </>
        );
      }
    }
  })();
  // Parts are laid out from the item's top-left corner; shift so the item is centred on its footprint.
  return <group position={[-w / 2, 0, -h / 2]}>{parts}</group>;
}

/** How far each wall design stands out from the wall, in feet (also used for walking collisions). */
export const WALL_DESIGN_DEPTH: Record<WallDesignType, number> = { shelves: 0.8, display_unit: 1.5 };

/**
 * A design mounted on a wall: x runs along the wall (centred on 0), z points into the room
 * from the wall face, y is up. Sized to the wall's length and the room's height.
 */
export function WallDesign3D({ design, length, height }: { design: WallDesignType; length: number; height: number }) {
  const top = Math.min(8, height - 0.5);
  if (design === "shelves") {
    const w = Math.max(1, Math.min(length * 0.7, length - 0.5));
    const levels = [3.5, 4.75, 6, 7.25].filter((y) => y < top);
    return (
      <group position={[-w / 2, 0, 0]}>
        {levels.map((y, i) => (
          <group key={y}>
            <Box x={0} z={0} w={w} d={0.8} y={y} h={0.12} color={C.wood} />
            {/* A few books and a vase so the shelves read as shelves. */}
            <Box x={w * (0.12 + 0.2 * (i % 2))} z={0.15} w={0.5} d={0.5} y={y + 0.12} h={0.7} color={i % 2 ? "#7c8463" : "#b98a5e"} />
            <Box x={w * (0.12 + 0.2 * (i % 2)) + 0.55} z={0.15} w={0.25} d={0.5} y={y + 0.12} h={0.6} color="#d8d1c3" />
            <Cyl cx={w * (0.7 - 0.15 * (i % 2))} cz={0.4} rx={0.18} y={y + 0.12} h={0.55} color={i % 2 ? "#e7e1d6" : "#b8794f"} />
          </group>
        ))}
      </group>
    );
  }
  // Display unit: closed base cabinet, wooden back panel, open shelves in three bays above.
  const w = Math.max(1, length - 0.2);
  const base = 2.5;
  const bays = Math.max(1, Math.min(4, Math.round(w / 3)));
  const shelfYs = [base + 1.4, base + 2.8, base + 4.2].filter((y) => y < top - 0.3);
  return (
    <group position={[-w / 2, 0, 0]}>
      <Box x={0} z={0} w={w} d={1.5} h={base} color={C.cabinet} />
      <Box x={0} z={0} w={w} d={1.55} y={base} h={0.1} color={C.woodDark} />
      {Array.from({ length: bays - 1 }, (_, i) => (
        <Box key={`door${i}`} x={((i + 1) * w) / bays - 0.02} z={1.5} w={0.04} d={0.02} y={0.2} h={base - 0.4} color="#c9c2b4" />
      ))}
      <Box x={0} z={0} w={w} d={0.1} y={base + 0.1} h={top - base - 0.1} color={C.wood} />
      <Box x={0} z={0} w={w} d={1.1} y={top - 0.15} h={0.15} color={C.woodDark} />
      {Array.from({ length: bays + 1 }, (_, i) => (
        <Box key={`side${i}`} x={Math.min(w - 0.12, (i * w) / bays)} z={0} w={0.12} d={1.1} y={base + 0.1} h={top - base - 0.25} color={C.woodDark} />
      ))}
      {shelfYs.map((y, i) => (
        <group key={y}>
          <Box x={0} z={0} w={w} d={1.1} y={y} h={0.08} color={C.woodDark} />
          {Array.from({ length: bays }, (_, b) => (
            <Box
              key={b}
              x={(b * w) / bays + 0.4 + ((i + b) % 2) * 0.6}
              z={0.3}
              w={0.45}
              d={0.45}
              y={y + 0.08}
              h={0.5 + ((i + b) % 3) * 0.15}
              color={["#7c8463", "#d8d1c3", "#b8794f"][(i + b) % 3]}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
