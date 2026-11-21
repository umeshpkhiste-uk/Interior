"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { CameraControls, Html } from "@react-three/drei";
import CameraControlsImpl from "camera-controls";
import * as THREE from "three";
import {
  ArrowDown,
  ArrowUp,
  Box as BoxIcon,
  Check,
  Download,
  Eye,
  Footprints,
  Layers,
  Paintbrush,
  Play,
  RotateCcw,
  RotateCw,
  Scan,
  Square,
  SquareDashed,
} from "lucide-react";
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
  type FurnitureType,
  type PlanPassage,
  type RoomFinishInput,
} from "@/lib/validations/floor-plan";
import { saveRoomFinish } from "@/lib/actions/floor-plan";
import { cn } from "@/lib/utils";
import { floorKind, HEDGE_FT, WALL_FT, type FloorKind } from "./floor-plan-symbols";
import { Furniture3D } from "./floor-plan-3d-models";

type CameraView = "walk" | "iso" | "top" | "front" | "custom";
/** Height slider stops: 0 = standing in a room, 100 = straight down. */
const LEVEL_EYE = 0;
const LEVEL_FRONT = 30;
const LEVEL_ISO = 55;
const EYE_FT = 5.25;
/** At eye level the orbit target sits this far ahead, so dragging turns the head. */
const LOOK_FT = 0.1;
const WALK_SPEED = 6;
const TURN_SPEED = 1.5;
const ORBIT_FOV = 40;
const WALK_FOV = 62;
type WalkKey = "forward" | "back" | "left" | "right" | "turnLeft" | "turnRight" | "fast";
const KEY_MAP: Record<string, WalkKey> = {
  ArrowUp: "forward",
  KeyW: "forward",
  ArrowDown: "back",
  KeyS: "back",
  KeyA: "left",
  KeyD: "right",
  ArrowLeft: "turnLeft",
  KeyQ: "turnLeft",
  ArrowRight: "turnRight",
  KeyE: "turnRight",
  ShiftLeft: "fast",
  ShiftRight: "fast",
};
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
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  const keys = useRef(new Set<WalkKey>());
  const tourRef = useRef(0);
  const eyePose = useRef<Pose | null>(null);
  const [level, setLevel] = useState(LEVEL_ISO);
  const [view, setView] = useState<CameraView>("iso");
  const [touring, setTouring] = useState(false);
  const [cutaway, setCutaway] = useState(true);
  const [labels, setLabels] = useState(true);
  const walk = level === LEVEL_EYE;

  const building = useMemo(() => boundsOf(rooms), [rooms]);
  const center = useMemo(
    () => ({ x: (building.minX + building.maxX) / 2, z: (building.minY + building.maxY) / 2 }),
    [building]
  );
  const span = Math.max(building.maxX - building.minX + passage.left + passage.right, building.maxY - building.minY + passage.top + passage.bottom, 10);
  const walkArea = useMemo(
    () =>
      new THREE.Box3(
        new THREE.Vector3(building.minX - passage.left - center.x - 2, -1, building.minY - passage.top - center.z - 2),
        new THREE.Vector3(building.maxX + passage.right - center.x + 2, 12, building.maxY + passage.bottom - center.z + 2)
      ),
    [building, passage, center]
  );
  // Everything you'd bump into at eye level: walls, window sills and glass (door lintels are
  // overhead), plus furniture. Furniture is shrunk a little so you can step up close to it.
  const colliders = useMemo<Rect[]>(() => {
    const { walls, glass } = buildWalls(rooms, false);
    const structure = [...walls, ...glass]
      .filter((b) => b.y0 < EYE_FT && b.y1 > 0.5)
      .map((b) => ({ minX: b.x - center.x, maxX: b.x + b.w - center.x, minZ: b.z - center.z, maxZ: b.z + b.d - center.z }));
    const furniture = rooms.flatMap((room) =>
      room.furniture
        .filter((item) => !WALK_OVER_FURNITURE.has(item.type))
        .map((item) => {
          const r = itemPlanRect(room, item);
          const ix = Math.min(FURNITURE_INSET_FT, r.w / 4);
          const iz = Math.min(FURNITURE_INSET_FT, r.h / 4);
          return {
            minX: r.x + ix - center.x,
            maxX: r.x + r.w - ix - center.x,
            minZ: r.y + iz - center.z,
            maxZ: r.y + r.h - iz - center.z,
          };
        })
    );
    return [...structure, ...furniture];
  }, [rooms, center]);
  const indoorRooms = useMemo(() => {
    const inside = rooms.filter((r) => !isPassage(r));
    return inside.length > 0 ? inside : rooms;
  }, [rooms]);
  const [walkRoomId, setWalkRoomId] = useState<string | null>(() => largestRoom(indoorRooms)?.id ?? null);
  const walkRoom = indoorRooms.find((r) => r.id === walkRoomId) ?? largestRoom(indoorRooms);

  const configure = useCallback(
    (c: CameraControlsImpl, eye: boolean) => applyCameraMode(c, eye, eye ? walkArea : null, span),
    [walkArea, span]
  );

  function eyeOf(room: FloorPlanRoom | null | undefined): Pose {
    return room ? roomEyePose(room, center, colliders) : { pos: [0, EYE_FT, span / 3], target: [0, EYE_FT - 0.015, span / 3 - LOOK_FT] };
  }

  function currentPose(c: CameraControlsImpl): Pose {
    const p = c.getPosition(new THREE.Vector3(), true);
    const t = c.getTarget(new THREE.Vector3(), true);
    return { pos: [p.x, p.y, p.z], target: [t.x, t.y, t.z] };
  }

  /** Moves the camera along the ground → bird's-eye → top path. 0 = eye level, 100 = straight down. */
  function goToLevel(next: number, opts: { room?: FloorPlanRoom } = {}) {
    const c = controlsRef.current;
    if (!c) return;
    // Leaving eye level keeps the spot you were standing at as the bottom of the path.
    if (walk && next !== LEVEL_EYE) eyePose.current = currentPose(c);
    if (opts.room || !eyePose.current) eyePose.current = eyeOf(opts.room ?? walkRoom);
    const eye = eyePose.current;
    const iso = overviewPose("iso", span);
    const top = overviewPose("top", span);
    const [a, b, u] = next <= LEVEL_ISO ? [eye, iso, next / LEVEL_ISO] : [iso, top, (next - LEVEL_ISO) / (100 - LEVEL_ISO)];
    configure(c, next === LEVEL_EYE);
    setLevel(next);
    setView(next === LEVEL_EYE ? "walk" : next === LEVEL_ISO ? "iso" : next === 100 ? "top" : "custom");
    void c.lerpLookAt(...a.pos, ...a.target, ...b.pos, ...b.target, u, true);
  }

  function stopTour() {
    if (tourRef.current % 2 === 1) {
      tourRef.current++;
      setTouring(false);
    }
  }

  function showView(next: CameraView) {
    stopTour();
    if (next === "walk") return goToLevel(LEVEL_EYE);
    if (next === "iso") return goToLevel(LEVEL_ISO);
    if (next === "top") return goToLevel(100);
    const c = controlsRef.current;
    if (!c) return;
    if (walk) eyePose.current = currentPose(c);
    configure(c, false);
    setLevel(LEVEL_FRONT);
    setView("front");
    const front = overviewPose("front", span);
    void c.setLookAt(...front.pos, ...front.target, true);
  }

  function enterRoom(room: FloorPlanRoom) {
    stopTour();
    setWalkRoomId(room.id);
    goToLevel(LEVEL_EYE, { room });
  }

  /** Double-click on a floor: stand at that spot, facing the way the camera already faces. */
  const walkTo = useCallback(
    (point: THREE.Vector3, roomId: string | null) => {
      const c = controlsRef.current;
      if (!c) return;
      tourRef.current += tourRef.current % 2;
      setTouring(false);
      const p = c.getPosition(new THREE.Vector3(), true);
      const t = c.getTarget(new THREE.Vector3(), true);
      const dir = new THREE.Vector3(t.x - p.x, 0, t.z - p.z);
      if (dir.lengthSq() < 1e-8) dir.set(0, 0, -1);
      dir.normalize().multiplyScalar(LOOK_FT);
      const pose: Pose = {
        pos: [point.x, EYE_FT, point.z],
        target: [point.x + dir.x, EYE_FT - 0.015, point.z + dir.z],
      };
      eyePose.current = pose;
      if (roomId) setWalkRoomId(roomId);
      configure(c, true);
      setLevel(LEVEL_EYE);
      setView("walk");
      void c.setLookAt(...pose.pos, ...pose.target, true);
    },
    [configure]
  );

  /** Fly-through: top view, swoop down to eye level, then visit and look around each room. */
  async function playTour() {
    const c = controlsRef.current;
    if (!c) return;
    stopTour();
    const token = ++tourRef.current; // odd = a tour is running
    const alive = () => tourRef.current === token;
    setTouring(true);
    const smooth = c.smoothTime;
    try {
      c.smoothTime = 0.9;
      configure(c, false);
      setLevel(100);
      setView("top");
      const top = overviewPose("top", span);
      await c.setLookAt(...top.pos, ...top.target, true);
      await pause(500);
      if (!alive()) return;
      setLevel(LEVEL_ISO);
      setView("iso");
      const iso = overviewPose("iso", span);
      await c.setLookAt(...iso.pos, ...iso.target, true);
      for (const room of indoorRooms) {
        if (!alive()) return;
        const eye = roomEyePose(room, center, colliders);
        eyePose.current = eye;
        setWalkRoomId(room.id);
        configure(c, true);
        setLevel(LEVEL_EYE);
        setView("walk");
        await c.setLookAt(...eye.pos, ...eye.target, true);
        if (!alive()) return;
        c.smoothTime = 1.6;
        await c.rotate(-Math.PI * 0.55, 0, true);
        c.smoothTime = 0.9;
        await pause(250);
      }
      if (!alive()) return;
      eyePose.current = currentPose(c);
      configure(c, false);
      setLevel(LEVEL_ISO);
      setView("iso");
      await c.setLookAt(...iso.pos, ...iso.target, true);
    } finally {
      c.smoothTime = smooth;
      if (alive()) {
        tourRef.current++;
        setTouring(false);
      }
    }
  }

  // Stop a running tour when the page goes away.
  useEffect(() => () => void (tourRef.current += tourRef.current % 2), []);

  function onKey(e: React.KeyboardEvent, down: boolean) {
    const key = KEY_MAP[e.code];
    if (!key || !walk) return;
    e.preventDefault();
    if (down) {
      stopTour();
      keys.current.add(key);
    } else keys.current.delete(key);
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
          <Button size="sm" variant={view === "walk" ? "secondary" : "ghost"} onClick={() => showView("walk")}>
            <Footprints className="size-4" /> Walk-through
          </Button>
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
        <Button size="sm" variant={touring ? "secondary" : "outline"} onClick={() => (touring ? stopTour() : void playTour())}>
          {touring ? <Square className="size-4" /> : <Play className="size-4" />} {touring ? "Stop tour" : "Play tour"}
        </Button>
        <Button
          size="sm"
          variant={cutaway && !walk ? "secondary" : "outline"}
          aria-pressed={cutaway}
          disabled={walk}
          title={walk ? "Walls are full height at eye level" : undefined}
          onClick={() => setCutaway((v) => !v)}
        >
          <SquareDashed className="size-4" /> Cut-away walls
        </Button>
        <Button
          size="sm"
          variant={labels ? "secondary" : "outline"}
          aria-pressed={labels}
          title="Point at a room to see its name and size"
          onClick={() => setLabels((v) => !v)}
        >
          <Layers className="size-4" /> Room labels
        </Button>
        <Button size="sm" variant="outline" onClick={downloadImage} className="ml-auto">
          <Download className="size-4" /> Download image
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {walk
          ? "Eye level: drag (or swipe sideways on a trackpad) to look around, W/A/S/D or the arrow keys (or the on-screen pad) to walk, scroll to step forward or back. Double-click any floor to stand there."
          : "Use the height slider to go from eye level up to the top view. Drag or swipe sideways to turn, scroll or pinch to zoom, right-drag to pan. Point at a room to see its name and size. Double-click any floor to stand there at eye level."}
      </p>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div
          className="relative h-[70vh] min-h-[420px] overflow-hidden rounded-lg border bg-[#f3efe8] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          tabIndex={0}
          aria-label="3D model"
          onKeyDown={(e) => onKey(e, true)}
          onKeyUp={(e) => onKey(e, false)}
          onBlur={() => keys.current.clear()}
          onPointerDown={(e) => {
            if (e.target instanceof HTMLCanvasElement) e.currentTarget.focus({ preventScroll: true });
          }}
        >
          <Canvas
            ref={canvasRef}
            shadows
            dpr={[1, 2]}
            gl={{ preserveDrawingBuffer: true, antialias: true }}
            camera={{ fov: ORBIT_FOV, near: 0.2, far: 4000, position: overviewPose("iso", span).pos }}
          >
            <color attach="background" args={["#f3efe8"]} />
            <group position={[-center.x, 0, -center.z]}>
              <Scene
                rooms={rooms}
                passage={passage}
                building={building}
                cutaway={cutaway && !walk}
                eyeLevel={walk}
                labels={labels && !walk}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onWalkTo={walkTo}
              />
            </group>
            <Lights span={span} />
            <CameraControls ref={controlsRef} makeDefault smoothTime={0.3} onControlStart={stopTour} />
            <CameraRig controlsRef={controlsRef} configure={configure} walk={walk} keys={keys} colliders={colliders} />
          </Canvas>

          <HeightSlider
            value={level}
            onChange={(v) => {
              stopTour();
              goToLevel(v);
            }}
          />

          {walk && (
            <>
              <div className="absolute top-3 left-3 z-30 flex items-center gap-2 rounded-md bg-white/90 px-2 py-1 text-xs shadow-sm ring-1 ring-black/5">
                <Footprints className="size-3.5 text-muted-foreground" />
                <label htmlFor="walk-room" className="text-muted-foreground">
                  Go to
                </label>
                <select
                  id="walk-room"
                  className="bg-transparent font-medium outline-none"
                  value={walkRoom?.id ?? ""}
                  onChange={(e) => {
                    const room = indoorRooms.find((r) => r.id === e.target.value);
                    if (room) enterRoom(room);
                  }}
                >
                  {indoorRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="absolute bottom-3 left-3 z-30 grid grid-cols-3 gap-1 select-none" aria-label="Walk controls">
                <span />
                <PadButton label="Walk forward" walkKey="forward" keys={keys} onStart={stopTour}>
                  <ArrowUp className="size-4" />
                </PadButton>
                <span />
                <PadButton label="Turn left" walkKey="turnLeft" keys={keys} onStart={stopTour}>
                  <RotateCcw className="size-4" />
                </PadButton>
                <PadButton label="Walk back" walkKey="back" keys={keys} onStart={stopTour}>
                  <ArrowDown className="size-4" />
                </PadButton>
                <PadButton label="Turn right" walkKey="turnRight" keys={keys} onStart={stopTour}>
                  <RotateCw className="size-4" />
                </PadButton>
              </div>
            </>
          )}
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

/** Hold to keep walking or turning; works with mouse and touch. */
function PadButton({
  label,
  walkKey,
  keys,
  onStart,
  children,
}: {
  label: string;
  walkKey: WalkKey;
  keys: React.RefObject<Set<WalkKey>>;
  onStart: () => void;
  children: React.ReactNode;
}) {
  const release = () => keys.current.delete(walkKey);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex size-9 touch-none items-center justify-center rounded-md bg-white/90 text-neutral-700 shadow-sm ring-1 ring-black/10 hover:bg-white active:bg-neutral-100"
      onPointerDown={(e) => {
        e.preventDefault();
        onStart();
        keys.current.add(walkKey);
      }}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
    >
      {children}
    </button>
  );
}

/** Vertical "elevator" from eye level (bottom) to the top view. */
function HeightSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="absolute top-3 right-3 bottom-3 z-30 flex w-14 flex-col items-center gap-1 rounded-md bg-white/90 py-2 text-[10px] font-medium text-neutral-600 shadow-sm ring-1 ring-black/5">
      <button type="button" aria-label="Jump to top view" className="hover:text-neutral-900" onClick={() => onChange(100)}>
        Top
      </button>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-label="Camera height, from eye level to top view"
        aria-valuetext={value === LEVEL_EYE ? "Eye level" : value === 100 ? "Top view" : `${value}%`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-h-0 flex-1 cursor-pointer accent-neutral-800 [direction:rtl] [writing-mode:vertical-lr]"
      />
      <button
        type="button"
        aria-label="Jump to eye level"
        className="text-center leading-tight hover:text-neutral-900"
        onClick={() => onChange(LEVEL_EYE)}
      >
        Eye
        <br />
        level
      </button>
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

type Pose = { pos: [number, number, number]; target: [number, number, number] };

function overviewPose(view: "iso" | "top" | "front", span: number): Pose {
  const pos: [number, number, number] =
    view === "top" ? [0, span * 1.6, 0.01] : view === "front" ? [0, span * 0.45, span * 1.3] : [span * 0.75, span * 0.95, span];
  return { pos, target: [0, 0, 0] };
}

/**
 * Standing just inside one end of the room at eye height, looking down its length. If
 * furniture is in the way there, the nearest clear spot in the room is used instead.
 */
function roomEyePose(room: FloorPlanRoom, center: { x: number; z: number }, colliders: Rect[]): Pose {
  const { w, h } = footprint(room);
  const eye = Math.max(2, Math.min(EYE_FT, room.heightFt - 1));
  const x0 = room.x - center.x;
  const z0 = room.y - center.z;
  const along = w >= h;
  const start = along ? { x: x0 + Math.min(1.5, w * 0.15), z: z0 + h / 2 } : { x: x0 + w / 2, z: z0 + h - Math.min(1.5, h * 0.15) };
  // A good spot has a little elbow room and about 2 ft of clear floor in the direction you face.
  const [fx, fz] = along ? [1, 0] : [0, -1];
  const clear = (x: number, z: number) =>
    [0, 0.5, 1, 1.5, 2].every((k) => penetration(x + fx * k, z + fz * k, colliders) <= -0.2);
  let spot = start;
  if (!clear(start.x, start.z)) {
    let best = Infinity;
    for (let gx = x0 + 0.8; gx <= x0 + w - 0.8; gx += 0.5) {
      for (let gz = z0 + 0.8; gz <= z0 + h - 0.8; gz += 0.5) {
        const d = Math.hypot(gx - start.x, gz - start.z);
        if (d < best && clear(gx, gz)) {
          best = d;
          spot = { x: gx, z: gz };
        }
      }
    }
  }
  return along
    ? { pos: [spot.x, eye, spot.z], target: [spot.x + LOOK_FT, eye - 0.015, spot.z] }
    : { pos: [spot.x, eye, spot.z], target: [spot.x, eye - 0.015, spot.z - LOOK_FT] };
}

function largestRoom(rooms: FloorPlanRoom[]): FloorPlanRoom | undefined {
  return rooms.reduce<FloorPlanRoom | undefined>((best, r) => (!best || r.lengthFt * r.widthFt > best.lengthFt * best.widthFt ? r : best), undefined);
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Orbit mode circles the model; eye-level mode turns the camera into a person standing in
 * the room: dragging looks around (the target sits a hand's width ahead), and the wheel and
 * keys walk instead of zooming. Walking is kept inside the plot.
 */
function applyCameraMode(c: CameraControlsImpl, eye: boolean, area: THREE.Box3 | null, span: number) {
  const A = CameraControlsImpl.ACTION;
  c.minDistance = 0.01;
  c.maxDistance = span * 4;
  c.dollyToCursor = false;
  if (eye) {
    c.minPolarAngle = 0.35;
    c.maxPolarAngle = Math.PI - 0.35;
    c.azimuthRotateSpeed = -0.35;
    c.polarRotateSpeed = -0.35;
    c.mouseButtons.left = A.ROTATE;
    c.mouseButtons.middle = A.NONE;
    c.mouseButtons.right = A.NONE;
    c.mouseButtons.wheel = A.NONE;
    c.touches.one = A.TOUCH_ROTATE;
    c.touches.two = A.NONE;
    c.touches.three = A.NONE;
    c.setBoundary(area ?? undefined);
  } else {
    c.minPolarAngle = 0;
    c.maxPolarAngle = Math.PI / 2 - 0.04;
    c.azimuthRotateSpeed = 1;
    c.polarRotateSpeed = 1;
    c.mouseButtons.left = A.ROTATE;
    c.mouseButtons.middle = A.DOLLY;
    c.mouseButtons.right = A.TRUCK;
    c.mouseButtons.wheel = A.DOLLY;
    c.touches.one = A.TOUCH_ROTATE;
    c.touches.two = A.TOUCH_DOLLY_TRUCK;
    c.touches.three = A.TOUCH_TRUCK;
    c.setBoundary(undefined);
  }
}

type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };
/** Flat on the floor (or a walk-in area), so you can walk over/into them. */
const WALK_OVER_FURNITURE = new Set<FurnitureType>(["rug", "shower"]);
/** Furniture outlines are pulled in by this much, since the body radius is sized for walls. */
const FURNITURE_INSET_FT = 0.3;
/** How close the walker's eye may get to a wall, in feet. */
const BODY_FT = 0.7;
const SUBSTEP_FT = 0.2;

/** How far a body standing at (x, z) sinks into the nearest obstacle; ≤ 0 means it's clear. */
function penetration(x: number, z: number, rects: Rect[]): number {
  let worst = -Infinity;
  for (const r of rects) {
    const dx = Math.max(r.minX - x, 0, x - r.maxX);
    const dz = Math.max(r.minZ - z, 0, z - r.maxZ);
    worst = Math.max(worst, BODY_FT - Math.hypot(dx, dz));
  }
  return worst;
}

const _pos = new THREE.Vector3();
const _target = new THREE.Vector3();

/**
 * Walks by (ahead, side) feet relative to where the camera faces, stopping at walls and
 * sliding along them. Long moves are taken in small steps so a fast scroll can't jump a wall.
 * If you start inside an obstacle (e.g. after double-clicking right next to a wall), only
 * moves that get you out are allowed.
 */
function walkBy(c: CameraControlsImpl, ahead: number, side: number, rects: Rect[], smooth: boolean) {
  const p = c.getPosition(_pos, true);
  const t = c.getTarget(_target, true);
  let fx = t.x - p.x;
  let fz = t.z - p.z;
  const len = Math.hypot(fx, fz);
  if (len < 1e-6) return;
  fx /= len;
  fz /= len;
  const dx = fx * ahead - fz * side;
  const dz = fz * ahead + fx * side;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / SUBSTEP_FT));
  let x = p.x;
  let z = p.z;
  const free = (nx: number, nz: number) => {
    const depth = penetration(nx, nz, rects);
    return depth <= 0 || depth < penetration(x, z, rects) - 1e-6;
  };
  for (let i = 0; i < steps; i++) {
    const sx = dx / steps;
    const sz = dz / steps;
    if (free(x + sx, z + sz)) {
      x += sx;
      z += sz;
    } else if (sx !== 0 && free(x + sx, z)) x += sx;
    else if (sz !== 0 && free(x, z + sz)) z += sz;
    else break;
  }
  if (x === p.x && z === p.z) return;
  void c.moveTo(t.x + (x - p.x), t.y, t.z + (z - p.z), smooth);
}

/** Applies the camera mode, eases the field of view, and moves the walker from held keys. */
function CameraRig({
  controlsRef,
  configure,
  walk,
  keys,
  colliders,
}: {
  controlsRef: React.RefObject<CameraControlsImpl | null>;
  configure: (c: CameraControlsImpl, eye: boolean) => void;
  walk: boolean;
  keys: React.RefObject<Set<WalkKey>>;
  colliders: Rect[];
}) {
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const c = controlsRef.current;
    if (c) configure(c, walk);
  }, [controlsRef, configure, walk]);

  // A sideways trackpad swipe (or shift+wheel) turns the view left/right the same way a drag
  // does. At eye level the up/down wheel steps forward and back instead of zooming. This
  // listens on the canvas's parent in the capture phase so it runs before camera-controls'
  // own zoom handler.
  useEffect(() => {
    const el = gl.domElement.parentElement ?? gl.domElement;
    const onWheel = (e: WheelEvent) => {
      const c = controlsRef.current;
      if (!c) return;
      const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      const sideways = Math.abs(dx) > Math.abs(e.deltaY) || (e.shiftKey && dx !== 0);
      if (sideways) {
        e.preventDefault();
        e.stopPropagation();
        const height = gl.domElement.clientHeight || 1;
        void c.rotate((Math.PI * c.azimuthRotateSpeed * dx) / height, 0, true);
        return;
      }
      if (!walk) return;
      e.preventDefault();
      e.stopPropagation();
      walkBy(c, -e.deltaY * 0.012, 0, colliders, true);
    };
    el.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => el.removeEventListener("wheel", onWheel, { capture: true });
  }, [walk, gl, controlsRef, colliders]);

  useFrame((state, delta) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    const dt = Math.min(delta, 0.1);
    const fov = walk ? WALK_FOV : ORBIT_FOV;
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov += (fov - camera.fov) * Math.min(1, dt * 5);
      camera.updateProjectionMatrix();
    }
    const c = controlsRef.current;
    const held = keys.current;
    if (!walk || !c || held.size === 0) return;
    const step = WALK_SPEED * (held.has("fast") ? 2 : 1) * dt;
    const ahead = Number(held.has("forward")) - Number(held.has("back"));
    const side = Number(held.has("right")) - Number(held.has("left"));
    const turn = Number(held.has("turnLeft")) - Number(held.has("turnRight"));
    if (ahead || side) walkBy(c, ahead * step, side * step, colliders, false);
    if (turn) void c.rotate(turn * TURN_SPEED * dt, 0, false);
  });

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
  onDoubleClick,
  onHover,
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
  onDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
  onHover?: (over: boolean) => void;
}) {
  const map = useMemo(() => {
    const t = textures[kind].clone();
    t.repeat.set(w / TEXTURE_FEET[kind], d / TEXTURE_FEET[kind]);
    t.needsUpdate = true;
    return t;
  }, [textures, kind, w, d]);
  return (
    <mesh
      position={[x + w / 2, y, z + d / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onPointerOver={
        onHover &&
        ((e) => {
          e.stopPropagation();
          onHover(true);
        })
      }
      onPointerOut={onHover && (() => onHover(false))}
    >
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

const Scene = memo(function Scene({
  rooms,
  passage,
  building,
  cutaway,
  eyeLevel,
  labels,
  selectedId,
  onSelect,
  onWalkTo,
}: {
  rooms: FloorPlanRoom[];
  passage: PlanPassage;
  building: Bounds;
  cutaway: boolean;
  eyeLevel: boolean;
  labels: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onWalkTo: (point: THREE.Vector3, roomId: string | null) => void;
}) {
  // A click selects a room, but not the end of an orbit drag.
  const pick = (roomId: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta <= 4) onSelect(roomId);
  };
  // Room names and sizes show only for the room under the pointer.
  const [hoverId, setHoverId] = useState<string | null>(null);
  const hover = (roomId: string) => (over: boolean) =>
    setHoverId((current) => (over ? roomId : current === roomId ? null : current));
  const standAt = (roomId: string | null) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onWalkTo(e.point.clone(), roomId);
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
          <FloorPlane
            kind="paver"
            x={plot.minX}
            z={plot.minY}
            w={plot.maxX - plot.minX}
            d={plot.maxY - plot.minY}
            y={0.004}
            textures={textures}
            onDoubleClick={standAt(null)}
          />
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
            onDoubleClick={standAt(room.id)}
            onHover={hover(room.id)}
          />
        );
      })}

      {eyeLevel &&
        rooms
          .filter((room) => !isPassage(room))
          .map((room) => {
            const { w, h } = footprint(room);
            return (
              <mesh key={`ceiling-${room.id}`} position={[room.x + w / 2, room.heightFt, room.y + h / 2]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[w, h]} />
                <meshStandardMaterial color="#fbfaf7" roughness={1} />
              </mesh>
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

      {/* Labels stay mounted and are hidden instead: unmounting drei's Html throws a removeChild error. */}
      {rooms.map((room) => {
          const { w, h } = footprint(room);
          const y = (cutaway ? Math.min(room.heightFt, CUTAWAY_FT) : room.heightFt) + 0.8;
          return (
            <Html
              key={`label-${room.id}`}
              position={[room.x + w / 2, y, room.y + h / 2]}
              center
              zIndexRange={[20, 0]}
              pointerEvents="none"
            >
              <div
                hidden={!labels || hoverId !== room.id}
                className="pointer-events-none rounded-md bg-white/85 px-2 py-0.5 text-center whitespace-nowrap shadow-sm ring-1 ring-black/5"
              >
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
});

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
