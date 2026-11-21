"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Box as BoxIcon, Check, Download, Eye, Layers, Paintbrush, Scan, SquareDashed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  containsPoint,
  footprint,
  isPassage,
  itemPlanRect,
  openingSpans,
  wallSegments,
  type FloorPlanRoom,
  type OpeningSpan,
} from "@/lib/calculations/floor-plan";
import {
  DEFAULT_WALL_COLOR,
  FLOOR_MATERIALS,
  FLOOR_MATERIAL_INFO,
  PAINT_COLORS,
  type FloorMaterial,
  type PlanPassage,
  type RoomFinishInput,
} from "@/lib/validations/floor-plan";
import { saveRoomFinish } from "@/lib/actions/floor-plan";
import { cn } from "@/lib/utils";
import { floorKind, HEDGE_FT, WALL_FT, type FloorKind } from "./floor-plan-symbols";
import { Furniture3D } from "./floor-plan-3d-models";

type CameraView = "iso" | "top" | "front";
const CUTAWAY_FT = 3;
const EXTERIOR_WALL_COLOR = "#e9e2d6";
const SAVE_DELAY_MS = 400;

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

function boundsOf(rooms: FloorPlanRoom[]): Bounds {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rooms) {
    const { w, h } = footprint(r);
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + w);
    maxY = Math.max(maxY, r.y + h);
  }
  return { minX, minY, maxX, maxY };
}

type Finish = Pick<FloorPlanRoom, "wallColor" | "floorMaterial">;

export function FloorPlan3DView({
  projectId,
  projectName,
  rooms: savedRooms,
  passage,
}: {
  projectId: string;
  projectName: string;
  rooms: FloorPlanRoom[];
  passage: PlanPassage;
}) {
  const [finishes, setFinishes] = useState<Record<string, Finish>>(() =>
    Object.fromEntries(savedRooms.map((r) => [r.id, { wallColor: r.wallColor, floorMaterial: r.floorMaterial }]))
  );
  const rooms = useMemo(() => savedRooms.map((r) => ({ ...r, ...finishes[r.id] })), [savedRooms, finishes]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const pending = useRef(new Map<string, RoomFinishInput>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    timer.current = null;
    const batch = [...pending.current.values()];
    pending.current.clear();
    if (batch.length === 0) return;
    setSaveState("saving");
    const results = await Promise.all(batch.map((input) => saveRoomFinish(projectId, input)));
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      toast.error(`Couldn't save the finish: ${failed.error}`);
      setSaveState("idle");
    } else setSaveState("saved");
  }, [projectId]);

  // Save anything still waiting when the page is left.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      void flush();
    },
    [flush]
  );

  function updateFinish(roomId: string, patch: Partial<Finish>) {
    const next = { ...finishes[roomId], ...patch };
    setFinishes((f) => ({ ...f, [roomId]: next }));
    pending.current.set(roomId, { roomId, wallColor: next.wallColor, floorMaterial: next.floorMaterial });
    setSaveState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
  }

  const selectedRoom = rooms.find((r) => r.id === selectedId) ?? null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<CameraView>("iso");
  const [viewVersion, setViewVersion] = useState(0);
  const [cutaway, setCutaway] = useState(true);
  const [labels, setLabels] = useState(true);

  const building = useMemo(() => boundsOf(rooms), [rooms]);
  const center = { x: (building.minX + building.maxX) / 2, z: (building.minY + building.maxY) / 2 };
  const span = Math.max(building.maxX - building.minX + passage.left + passage.right, building.maxY - building.minY + passage.top + passage.bottom, 10);

  function showView(next: CameraView) {
    setView(next);
    setViewVersion((n) => n + 1);
  }

  function downloadImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${projectName.replace(/[^\w-]+/g, "-").replace(/-+/g, "-").toLowerCase()}-3d.png`;
    link.click();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-md border">
          <Button size="sm" variant={view === "iso" ? "secondary" : "ghost"} onClick={() => showView("iso")}>
            <BoxIcon className="size-4" /> 3D view
          </Button>
          <Button size="sm" variant={view === "top" ? "secondary" : "ghost"} onClick={() => showView("top")}>
            <Scan className="size-4" /> Top
          </Button>
          <Button size="sm" variant={view === "front" ? "secondary" : "ghost"} onClick={() => showView("front")}>
            <Eye className="size-4" /> Front
          </Button>
        </div>
        <Button size="sm" variant={cutaway ? "secondary" : "outline"} aria-pressed={cutaway} onClick={() => setCutaway((v) => !v)}>
          <SquareDashed className="size-4" /> Cut-away walls
        </Button>
        <Button size="sm" variant={labels ? "secondary" : "outline"} aria-pressed={labels} onClick={() => setLabels((v) => !v)}>
          <Layers className="size-4" /> Room labels
        </Button>
        <Button size="sm" variant="outline" onClick={downloadImage} className="ml-auto">
          <Download className="size-4" /> Download image
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag to orbit, scroll or pinch to zoom, right-drag (or two fingers) to pan. Built from the saved 2D plan and room heights.
      </p>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="h-[70vh] min-h-[420px] overflow-hidden rounded-lg border bg-[#f3efe8]">
        <Canvas
          ref={canvasRef}
          shadows
          dpr={[1, 2]}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          camera={{ fov: 40, near: 0.5, far: 4000, position: [span * 0.75, span * 0.95, span] }}
        >
          <color attach="background" args={["#f3efe8"]} />
          <group position={[-center.x, 0, -center.z]}>
            <Scene
              rooms={rooms}
              passage={passage}
              building={building}
              cutaway={cutaway}
              labels={labels}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </group>
          <Lights span={span} />
          <CameraRig view={view} version={viewVersion} span={span} />
          <OrbitControls makeDefault enableDamping dampingFactor={0.12} maxPolarAngle={Math.PI / 2 - 0.04} minDistance={4} maxDistance={span * 4} />
        </Canvas>
      </div>
      <FinishesPanel
        rooms={rooms}
        selected={selectedRoom}
        onSelect={setSelectedId}
        onChange={updateFinish}
        saveState={saveState}
      />
      </div>
    </div>
  );
}

function FinishesPanel({
  rooms,
  selected,
  onSelect,
  onChange,
  saveState,
}: {
  rooms: FloorPlanRoom[];
  selected: FloorPlanRoom | null;
  onSelect: (id: string | null) => void;
  onChange: (roomId: string, patch: Partial<Finish>) => void;
  saveState: "idle" | "saving" | "saved";
}) {
  const currentFloor = selected ? floorKind(selected) : null;
  const currentWall = selected?.wallColor ?? DEFAULT_WALL_COLOR;
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Paintbrush className="size-4" /> Finishes
        </p>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? (
            <span className="flex items-center gap-1">
              <Check className="size-3" /> Saved
            </span>
          ) : null}
        </span>
      </div>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Room
        <select
          className="h-8 rounded-md border bg-background px-2 text-sm text-foreground"
          value={selected?.id ?? ""}
          onChange={(e) => onSelect(e.target.value || null)}
        >
          <option value="">Choose a room…</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>

      {!selected ? (
        <p className="text-xs text-muted-foreground">
          Click a room in the model, or choose one above, to set its wall paint and floor. Changes save automatically and
          show on the 2D plan too.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Wall paint</p>
            <div className="grid grid-cols-6 gap-1.5">
              {PAINT_COLORS.map((c) => {
                const on = selected.wallColor?.toLowerCase() === c.hex;
                return (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    aria-label={`${c.name} wall paint`}
                    aria-pressed={on}
                    onClick={() => onChange(selected.id, { wallColor: c.hex })}
                    className={cn(
                      "aspect-square rounded-md ring-1 ring-black/10 transition",
                      on && "ring-2 ring-primary ring-offset-1"
                    )}
                    style={{ background: c.hex }}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Custom
                <input
                  type="color"
                  value={currentWall}
                  onChange={(e) => onChange(selected.id, { wallColor: e.target.value })}
                  className="h-7 w-10 cursor-pointer rounded border bg-background p-0.5"
                  aria-label="Custom wall paint colour"
                />
              </label>
              <Button
                size="xs"
                variant="ghost"
                className="ml-auto"
                disabled={!selected.wallColor}
                onClick={() => onChange(selected.id, { wallColor: null })}
              >
                Default
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Floor</p>
            <div className="grid grid-cols-2 gap-1.5">
              {FLOOR_MATERIALS.map((m) => {
                const on = currentFloor === m;
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange(selected.id, { floorMaterial: m })}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition hover:bg-muted/60",
                      on && "border-primary bg-muted"
                    )}
                  >
                    <span className="size-4 shrink-0 rounded-sm ring-1 ring-black/10" style={{ background: FLOOR_MATERIAL_INFO[m].swatch }} />
                    {FLOOR_MATERIAL_INFO[m].label}
                  </button>
                );
              })}
            </div>
            <Button
              size="xs"
              variant="ghost"
              className="self-end"
              disabled={!selected.floorMaterial}
              onClick={() => onChange(selected.id, { floorMaterial: null })}
            >
              Default for room type
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Lights({ span }: { span: number }) {
  return (
    <>
      <hemisphereLight args={["#ffffff", "#d9cfbf", 1.1]} />
      <directionalLight
        position={[span * 0.5, span * 1.1, span * 0.35]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
        shadow-camera-near={1}
        shadow-camera-far={span * 4}
        shadow-bias={-0.0004}
      />
    </>
  );
}

function CameraRig({ view, version, span }: { view: CameraView; version: number; span: number }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; update: () => void } | null;
  useEffect(() => {
    const position: [number, number, number] =
      view === "top" ? [0, span * 1.6, 0.01] : view === "front" ? [0, span * 0.45, span * 1.3] : [span * 0.75, span * 0.95, span];
    camera.position.set(...position);
    camera.lookAt(0, 0, 0);
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [view, version, span, camera, controls]);
  return null;
}

/** Feet of floor covered by one copy of each generated texture. */
const TEXTURE_FEET: Record<FloorKind, number> = {
  wood: 4,
  walnut: 4,
  tile: 4,
  marble: 6,
  granite: 4,
  stone: 3,
  wetTile: 2,
  concrete: 12,
  carpet: 3,
  paver: 2,
};

function makeFloorTexture(kind: FloorKind): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grid = (cells: number, base: string, line: string, lineWidth = 2) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = line;
    ctx.lineWidth = lineWidth;
    for (let i = 0; i <= cells; i++) {
      const p = (i * size) / cells;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, size);
      ctx.moveTo(0, p);
      ctx.lineTo(size, p);
      ctx.stroke();
    }
  };
  switch (kind) {
    case "wood":
    case "walnut": {
      const rows = 8;
      const [a, b] = kind === "wood" ? ["#c3946a", "#c99b6b"] : ["#664329", "#6f4a2f"];
      for (let r = 0; r < rows; r++) {
        ctx.fillStyle = r % 2 ? a : b;
        ctx.fillRect(0, (r * size) / rows, size, size / rows);
        ctx.fillStyle = "rgba(120,80,45,0.35)";
        ctx.fillRect(0, ((r + 1) * size) / rows - 1, size, 2);
        const joint = ((r * 97) % 5) * (size / 5) + size / 10;
        ctx.fillRect(joint % size, (r * size) / rows, 2, size / rows);
      }
      break;
    }
    case "tile":
      grid(2, "#f1ebe0", "#ddd3c2");
      break;
    case "marble": {
      grid(1, "#f4f2ee", "#e4dfd6", 2);
      ctx.strokeStyle = "rgba(170,160,145,0.45)";
      ctx.lineWidth = 2;
      for (const [y0, y1, y2] of [[40, 90, 60], [150, 120, 190], [210, 240, 200]]) {
        ctx.beginPath();
        ctx.moveTo(0, y0);
        ctx.bezierCurveTo(80, y1, 170, y2, size, y0 + 20);
        ctx.stroke();
      }
      break;
    }
    case "granite": {
      grid(2, "#3b3a3d", "#29282b");
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = i % 3 ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.35)";
        ctx.fillRect((i * 73) % size, (i * 151) % size, 2, 2);
      }
      break;
    }
    case "carpet": {
      ctx.fillStyle = "#b9ad99";
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 2500; i++) {
        ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.08)" : "rgba(60,45,25,0.08)";
        ctx.fillRect((i * 37) % size, (i * 89) % size, 2, 2);
      }
      break;
    }
    case "wetTile":
      grid(2, "#c9cac7", "#b0b1ae");
      break;
    case "stone":
      grid(2, "#d6d3cc", "#bdb9b0", 3);
      break;
    case "concrete":
      grid(2, "#8f949a", "#7d8288", 2);
      break;
    case "paver": {
      grid(4, "#8d9095", "#737679", 3);
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 4; j++) {
          ctx.fillStyle = (i + j) % 2 ? "#999ca1" : "#85888d";
          ctx.fillRect((i * size) / 4 + 3, (j * size) / 4 + 3, size / 4 - 6, size / 4 - 6);
        }
      break;
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function FloorPlane({
  kind,
  x,
  z,
  w,
  d,
  y,
  textures,
  selected = false,
  onClick,
}: {
  kind: FloorKind;
  x: number;
  z: number;
  w: number;
  d: number;
  y: number;
  textures: Record<FloorKind, THREE.CanvasTexture>;
  selected?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const map = useMemo(() => {
    const t = textures[kind].clone();
    t.repeat.set(w / TEXTURE_FEET[kind], d / TEXTURE_FEET[kind]);
    t.needsUpdate = true;
    return t;
  }, [textures, kind, w, d]);
  return (
    <mesh position={[x + w / 2, y, z + d / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onClick}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial
        map={map}
        roughness={kind === "marble" || kind === "granite" ? 0.35 : 0.85}
        emissive={selected ? "#f59e0b" : "#000000"}
        emissiveIntensity={selected ? 0.12 : 0}
      />
    </mesh>
  );
}

type WallBox = { x: number; z: number; w: number; d: number; y0: number; y1: number; color: string };
type GlassPane = Omit<WallBox, "color">;

/**
 * Turns the plan's wall segments into 3D wall blocks. Coinciding walls of neighbouring
 * rooms are merged; doors leave a full-height gap (up to the lintel), windows leave a gap
 * between sill and head that gets a glass pane. Each wall is built as two half-thickness
 * skins so each face carries the paint of the room on that side.
 */
function buildWalls(rooms: FloorPlanRoom[], cutaway: boolean): { walls: WallBox[]; glass: GlassPane[] } {
  const heightOf = new Map(rooms.map((r) => [r.id, r.heightFt]));
  const lines = new Map<string, { horizontal: boolean; at: number; spans: { from: number; to: number; height: number }[] }>();
  for (const seg of wallSegments(rooms)) {
    const horizontal = seg.y1 === seg.y2;
    const at = horizontal ? seg.y1 : seg.x1;
    const key = `${horizontal ? "h" : "v"}:${Math.round(at * 20)}`;
    const line = lines.get(key) ?? { horizontal, at, spans: [] };
    line.spans.push({
      from: horizontal ? Math.min(seg.x1, seg.x2) : Math.min(seg.y1, seg.y2),
      to: horizontal ? Math.max(seg.x1, seg.x2) : Math.max(seg.y1, seg.y2),
      height: heightOf.get(seg.roomId) ?? 10,
    });
    lines.set(key, line);
  }

  const openings = openingSpans(rooms);
  const solid = rooms.filter((r) => !isPassage(r));
  const paintAt = (px: number, py: number) => {
    const room = solid.find((r) => containsPoint(r, px, py));
    return room ? room.wallColor ?? DEFAULT_WALL_COLOR : EXTERIOR_WALL_COLOR;
  };
  const edgesH = [...new Set(rooms.flatMap((r) => [r.x, r.x + footprint(r).w]))];
  const edgesV = [...new Set(rooms.flatMap((r) => [r.y, r.y + footprint(r).h]))];
  const walls: WallBox[] = [];
  const glass: GlassPane[] = [];
  const T = WALL_FT;

  for (const line of lines.values()) {
    const merged: { from: number; to: number; height: number }[] = [];
    for (const s of [...line.spans].sort((a, b) => a.from - b.from)) {
      const last = merged.at(-1);
      if (last && s.from <= last.to + 0.01) {
        last.to = Math.max(last.to, s.to);
        last.height = Math.max(last.height, s.height);
      } else merged.push({ ...s });
    }
    const cuts = openings.filter((o) => o.horizontal === line.horizontal && Math.abs(o.at - line.at) < 0.2);

    for (const run of merged) {
      const top = cutaway ? Math.min(run.height, CUTAWAY_FT) : run.height;
      const addGlass = (from: number, to: number, y0: number, y1: number) => {
        const yTop = Math.min(y1, top);
        if (to - from < 0.01 || yTop - y0 < 0.01) return;
        glass.push(
          line.horizontal
            ? { x: from, z: line.at - T / 2, w: to - from, d: T, y0, y1: yTop }
            : { x: line.at - T / 2, z: from, w: T, d: to - from, y0, y1: yTop }
        );
      };
      const add = (from: number, to: number, y0: number, y1: number, extendEnds: boolean) => {
        const yTop = Math.min(y1, top);
        if (to - from < 0.01 || yTop - y0 < 0.01) return;
        // Split where rooms start/end along the wall, so each piece has one room per side.
        const stops = [from, ...(line.horizontal ? edgesH : edgesV).filter((e) => e > from + 0.01 && e < to - 0.01), to].sort(
          (p, q) => p - q
        );
        for (let i = 0; i < stops.length - 1; i++) {
          const s0 = stops[i];
          const s1 = stops[i + 1];
          const a = extendEnds && s0 === run.from ? s0 - T / 2 : s0;
          const b = extendEnds && s1 === run.to ? s1 + T / 2 : s1;
          const mid = (s0 + s1) / 2;
          const [before, after] = line.horizontal
            ? [paintAt(mid, line.at - T), paintAt(mid, line.at + T)]
            : [paintAt(line.at - T, mid), paintAt(line.at + T, mid)];
          if (line.horizontal) {
            walls.push({ x: a, z: line.at - T / 2, w: b - a, d: T / 2, y0, y1: yTop, color: before });
            walls.push({ x: a, z: line.at, w: b - a, d: T / 2, y0, y1: yTop, color: after });
          } else {
            walls.push({ x: line.at - T / 2, z: a, w: T / 2, d: b - a, y0, y1: yTop, color: before });
            walls.push({ x: line.at, z: a, w: T / 2, d: b - a, y0, y1: yTop, color: after });
          }
        }
      };
      const inRun = cuts
        .map((c): OpeningSpan => ({ ...c, from: Math.max(c.from, run.from), to: Math.min(c.to, run.to) }))
        .filter((c) => c.to - c.from > 0.05)
        .sort((a, b) => a.from - b.from);
      let cursor = run.from;
      for (const c of inRun) {
        if (c.from > cursor) add(cursor, c.from, 0, run.height, true);
        const from = Math.max(c.from, cursor);
        if (c.sill > 0) add(from, c.to, 0, c.sill, false);
        add(from, c.to, Math.min(c.top, run.height), run.height, false);
        if (c.type === "window") addGlass(from, c.to, c.sill, Math.min(c.top, run.height));
        cursor = Math.max(cursor, c.to);
      }
      if (cursor < run.to) add(cursor, run.to, 0, run.height, true);
    }
  }
  return { walls, glass };
}

function Scene({
  rooms,
  passage,
  building,
  cutaway,
  labels,
  selectedId,
  onSelect,
}: {
  rooms: FloorPlanRoom[];
  passage: PlanPassage;
  building: Bounds;
  cutaway: boolean;
  labels: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  // A click selects a room, but not the end of an orbit drag.
  const pick = (roomId: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta <= 4) onSelect(roomId);
  };
  const textures = useMemo(
    () =>
      Object.fromEntries(
        (FLOOR_MATERIALS as readonly FloorMaterial[]).map((k) => [k, makeFloorTexture(k)])
      ) as Record<FloorKind, THREE.CanvasTexture>,
    []
  );
  const { walls, glass } = useMemo(() => buildWalls(rooms, cutaway), [rooms, cutaway]);
  const hasPassage = passage.top > 0 || passage.right > 0 || passage.bottom > 0 || passage.left > 0;
  const plot = {
    minX: building.minX - passage.left,
    minY: building.minY - passage.top,
    maxX: building.maxX + passage.right,
    maxY: building.maxY + passage.bottom,
  };
  const floorOrder = [...rooms].sort((a, b) => Number(isPassage(b)) - Number(isPassage(a)));

  return (
    <>
      <mesh position={[(plot.minX + plot.maxX) / 2, -0.02, (plot.minY + plot.maxY) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[(plot.maxX - plot.minX) * 6 + 60, (plot.maxY - plot.minY) * 6 + 60]} />
        <meshStandardMaterial color="#e9e3d8" roughness={1} />
      </mesh>

      {hasPassage && (
        <>
          <FloorPlane kind="paver" x={plot.minX} z={plot.minY} w={plot.maxX - plot.minX} d={plot.maxY - plot.minY} y={0.004} textures={textures} />
          <Hedges plot={plot} passage={passage} />
        </>
      )}

      {floorOrder.map((room, i) => {
        const { w, h } = footprint(room);
        return (
          <FloorPlane
            key={room.id}
            kind={floorKind(room)}
            x={room.x}
            z={room.y}
            w={w}
            d={h}
            y={0.01 + i * 0.002}
            textures={textures}
            selected={room.id === selectedId}
            onClick={pick(room.id)}
          />
        );
      })}

      {walls.map((b, i) => (
        <mesh key={`w${i}`} position={[b.x + b.w / 2, (b.y0 + b.y1) / 2, b.z + b.d / 2]} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.y1 - b.y0, b.d]} />
          <meshStandardMaterial color={b.color} roughness={0.9} />
        </mesh>
      ))}
      {glass.map((b, i) => (
        <mesh key={`g${i}`} position={[b.x + b.w / 2, (b.y0 + b.y1) / 2, b.z + b.d / 2]}>
          <boxGeometry args={[Math.max(b.w, 0.04) * (b.w < b.d ? 0.25 : 1), b.y1 - b.y0, Math.max(b.d, 0.04) * (b.d < b.w ? 0.25 : 1)]} />
          <meshStandardMaterial color="#a9c7d8" transparent opacity={0.35} roughness={0.05} metalness={0.1} />
        </mesh>
      ))}

      {rooms.flatMap((room) =>
        room.furniture.map((item) => {
          const rect = itemPlanRect(room, item);
          const angle = (-(room.rotation + item.rotation) * Math.PI) / 180;
          return (
            <group
              key={`${room.id}-${item.id}`}
              position={[rect.x + rect.w / 2, 0.012, rect.y + rect.h / 2]}
              rotation={[0, angle, 0]}
              onClick={pick(room.id)}
            >
              <Furniture3D item={item} roomHeight={room.heightFt} />
            </group>
          );
        })
      )}

      {labels &&
        rooms.map((room) => {
          const { w, h } = footprint(room);
          const y = (cutaway ? Math.min(room.heightFt, CUTAWAY_FT) : room.heightFt) + 0.8;
          return (
            <Html key={`label-${room.id}`} position={[room.x + w / 2, y, room.y + h / 2]} center zIndexRange={[20, 0]}>
              <div className="pointer-events-none rounded-md bg-white/85 px-2 py-0.5 text-center whitespace-nowrap shadow-sm ring-1 ring-black/5">
                <div className="text-[11px] font-bold tracking-wide text-neutral-800 uppercase">{room.name}</div>
                <div className="text-[10px] text-neutral-500">
                  {room.lengthFt.toFixed(1)} × {room.widthFt.toFixed(1)} × {room.heightFt.toFixed(1)} ft
                </div>
              </div>
            </Html>
          );
        })}
    </>
  );
}

function Hedges({ plot, passage }: { plot: Bounds; passage: PlanPassage }) {
  const strips: { x: number; z: number; w: number; d: number }[] = [];
  const topExtra = passage.top > 0 ? HEDGE_FT : 0;
  const bottomExtra = passage.bottom > 0 ? HEDGE_FT : 0;
  if (passage.top > 0) strips.push({ x: plot.minX, z: plot.minY - HEDGE_FT, w: plot.maxX - plot.minX, d: HEDGE_FT });
  if (passage.bottom > 0) strips.push({ x: plot.minX, z: plot.maxY, w: plot.maxX - plot.minX, d: HEDGE_FT });
  if (passage.left > 0) strips.push({ x: plot.minX - HEDGE_FT, z: plot.minY - topExtra, w: HEDGE_FT, d: plot.maxY - plot.minY + topExtra + bottomExtra });
  if (passage.right > 0) strips.push({ x: plot.maxX, z: plot.minY - topExtra, w: HEDGE_FT, d: plot.maxY - plot.minY + topExtra + bottomExtra });
  return (
    <>
      {strips.map((s, i) => {
        const along = Math.max(s.w, s.d);
        const count = Math.max(1, Math.round(along / 3.2));
        const horizontal = s.w >= s.d;
        return (
          <group key={i}>
            <mesh position={[s.x + s.w / 2, 0.4, s.z + s.d / 2]} castShadow receiveShadow>
              <boxGeometry args={[s.w, 0.8, s.d]} />
              <meshStandardMaterial color="#6e8f4e" roughness={1} />
            </mesh>
            {Array.from({ length: count }, (_, k) => {
              const t = (k + 0.5) / count;
              const cx = horizontal ? s.x + s.w * t : s.x + s.w / 2;
              const cz = horizontal ? s.z + s.d / 2 : s.z + s.d * t;
              return (
                <mesh key={k} position={[cx, 1.6, cz]} castShadow>
                  <sphereGeometry args={[HEDGE_FT * 0.75, 16, 12]} />
                  <meshStandardMaterial color={k % 2 ? "#3f6b2f" : "#4f7d3a"} roughness={1} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </>
  );
}
