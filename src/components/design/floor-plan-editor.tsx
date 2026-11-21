"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { RotateCw, RotateCcw, Save, Undo2, Redo2, LayoutGrid, Trash2, DoorOpen, AppWindow, Scissors, PanelTop } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  autoArrange,
  clampItem,
  containsPoint,
  defaultFurniture,
  footprint,
  formatFeetInches,
  isPassage,
  labelAnchor,
  localToPlan,
  newFurnitureItem,
  resizeItem,
  resolveOpenings,
  alongWall,
  wallLength,
  type DoorSwing,
  type PlanOpening,
  type ResolvedOpening,
  rotationTransform,
  sharedWalls,
  toLocalDelta,
  toOwnWall,
  transferItem,
  toWallGap,
  wallGapLine,
  wallPieceAt,
  wallSegments,
  WALLS,
  type FloorPlanRoom,
  type WallSegment,
  type PlanRotation,
  type Wall,
} from "@/lib/calculations/floor-plan";
import { toStandardFeet } from "@/lib/calculations/area";
import {
  FURNITURE_LABELS,
  FURNITURE_TYPES,
  PLAN_AREA_PRESETS,
  type FurnitureItem,
  type FurnitureType,
  type PlanPassage,
} from "@/lib/validations/floor-plan";
import { addFloorPlanArea, addFloorPlanOpening, saveFloorPlanLayout } from "@/lib/actions/floor-plan";
import { deleteOpening, deleteRoom } from "@/lib/actions/rooms";
import {
  DimensionLine,
  FLOOR_FILL,
  FurnitureShape,
  HEDGE_FT,
  PassageArea,
  PlanDefs,
  OpeningShape,
  wallFrameTransform,
  WALL_COLOR,
  WALL_FT,
  floorKind,
  localTransform,
} from "./floor-plan-symbols";

const GRID_FT = 0.25;
const EDGE_SNAP_FT = 0.6;
const PAD = { top: 5, left: 3.4, right: 1.5, bottom: 1.5 };
const SELECT_COLOR = "#d97706";
const PAPER = "#fbf8f3";

type Snapshot = { rooms: FloorPlanRoom[]; passage: PlanPassage };
const HISTORY_LIMIT = 100;

type Selection =
  | { kind: "room"; roomId: string }
  | { kind: "item"; roomId: string; itemId: string }
  | { kind: "opening"; roomId: string; openingId: string }
  | null;
type Drag = {
  mode: "move" | "resize" | "room-resize" | "opening" | "opening-resize";
  roomId: string;
  itemId: string | null;
  openingId?: string;
  /** Wall the door/window is drawn on when the drag starts (it may still be auto-placed). */
  wall?: Wall;
  pointerId: number;
  startX: number;
  startY: number;
  /** Start position for a move; start footprint width/depth for a resize. */
  originX: number;
  originY: number;
};

function boundsOf(rooms: FloorPlanRoom[]) {
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

/** Building plus its outside passage (the plot) and, beyond that, the hedge border. */
function plotBounds(rooms: FloorPlanRoom[], passage: PlanPassage) {
  const b = boundsOf(rooms);
  const plot = { minX: b.minX - passage.left, minY: b.minY - passage.top, maxX: b.maxX + passage.right, maxY: b.maxY + passage.bottom };
  const hedge = (side: keyof PlanPassage) => (passage[side] > 0 ? HEDGE_FT : 0);
  const outer = { minX: plot.minX - hedge("left"), minY: plot.minY - hedge("top"), maxX: plot.maxX + hedge("right"), maxY: plot.maxY + hedge("bottom") };
  return { building: b, plot, outer };
}

function frameFor(rooms: FloorPlanRoom[], passage: PlanPassage) {
  const b = plotBounds(rooms, passage).outer;
  return {
    x: b.minX - PAD.left,
    y: b.minY - PAD.top,
    w: b.maxX - b.minX + PAD.left + PAD.right,
    h: b.maxY - b.minY + PAD.top + PAD.bottom,
  };
}

/** Rugs sit under everything else in the room. */
const drawOrder = (items: FurnitureItem[]) => [...items].sort((a, b) => Number(b.type === "rug") - Number(a.type === "rug"));

const snapToGrid = (v: number) => Math.round(v / GRID_FT) * GRID_FT;
const nextRotation = (r: PlanRotation) => ((r + 90) % 360) as PlanRotation;

/** Pulls an edge onto a nearby wall of another room so neighbouring rooms share walls. */
function snapToEdges(pos: number, size: number, edges: number[]): number {
  let best = pos;
  let bestDist = EDGE_SNAP_FT;
  for (const edge of edges) {
    for (const candidate of [edge, edge - size]) {
      const dist = Math.abs(candidate - pos);
      if (dist < bestDist) {
        bestDist = dist;
        best = candidate;
      }
    }
  }
  return best;
}

export function FloorPlanEditor({
  projectId,
  projectName,
  initialRooms,
  initialPassage,
}: {
  projectId: string;
  projectName: string;
  initialRooms: FloorPlanRoom[];
  initialPassage: PlanPassage;
}) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [rooms, setRooms] = useState(initialRooms);
  const [passage, setPassage] = useState(initialPassage);
  const [frame, setFrame] = useState(() => frameFor(initialRooms, initialPassage));
  const [selection, setSelection] = useState<Selection>(null);
  /** "Remove wall" tool: clicking a wall piece removes it, clicking a removed piece puts it back. */
  const [wallTool, setWallTool] = useState(false);
  const [hoverPiece, setHoverPiece] = useState<ReturnType<typeof wallPieceAt> | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [baseline, setBaseline] = useState<Snapshot>(() => ({ rooms: initialRooms, passage: initialPassage }));
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const historyKeyRef = useRef<string | null>(null);
  const lastHistoryKeyRef = useRef<string | null>(null);
  const dragCounterRef = useRef(0);
  const dirty = useMemo(
    () => JSON.stringify({ rooms, passage }) !== JSON.stringify(baseline),
    [rooms, passage, baseline]
  );
  const [resetCount, setResetCount] = useState(0);
  const [pending, startTransition] = useTransition();
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null);
  const dirtyRef = useRef(false);
  const payloadRef = useRef<() => ReturnType<typeof layoutPayload>["payload"]>(() => {
    throw new Error("layout not ready");
  });

  const walls = useMemo(() => wallSegments(rooms), [rooms]);
  const sharedWallsByRoom = useMemo(() => new Map(rooms.map((r) => [r.id, sharedWalls(r, rooms)])), [rooms]);
  const selectedRoom = selection ? rooms.find((r) => r.id === selection.roomId) ?? null : null;
  const selectedOpening =
    selection?.kind === "opening" ? selectedRoom?.openings.find((o) => o.id === selection.openingId) ?? null : null;
  const selectedItem =
    selection?.kind === "item" ? selectedRoom?.furniture.find((f) => f.id === selection.itemId) ?? null : null;

  /**
   * Remembers the state before a change so it can be undone. Changes made under the same
   * history key (one drag, typing in one box) collapse into a single undo step.
   */
  function record() {
    const key = historyKeyRef.current;
    if (key !== null && key === lastHistoryKeyRef.current) return;
    lastHistoryKeyRef.current = key;
    setPast((p) => [...p.slice(-(HISTORY_LIMIT - 1)), { rooms, passage }]);
    setFuture([]);
  }

  function withHistoryKey(key: string, change: () => void) {
    historyKeyRef.current = key;
    change();
    historyKeyRef.current = null;
  }

  function restore(snapshot: Snapshot) {
    setRooms(snapshot.rooms);
    setPassage(snapshot.passage);
    setFrame(frameFor(snapshot.rooms, snapshot.passage));
    lastHistoryKeyRef.current = null;
  }

  function undo() {
    const previous = past.at(-1);
    if (!previous || drag) return;
    setPast(past.slice(0, -1));
    setFuture([...future, { rooms, passage }]);
    restore(previous);
  }

  function redo() {
    const next = future.at(-1);
    if (!next || drag) return;
    setFuture(future.slice(0, -1));
    setPast([...past, { rooms, passage }]);
    restore(next);
  }

  function commit(next: FloorPlanRoom[], refit = false) {
    record();
    setRooms(next);
    if (refit) setFrame(frameFor(next, passage));
  }

  function patchRoom(roomId: string, patch: (room: FloorPlanRoom) => Partial<FloorPlanRoom>, refit = false) {
    commit(rooms.map((r) => (r.id === roomId ? { ...r, ...patch(r) } : r)), refit);
  }

  function patchItem(roomId: string, itemId: string, patch: (item: FurnitureItem, room: FloorPlanRoom) => FurnitureItem) {
    patchRoom(roomId, (room) => ({
      furniture: room.furniture.map((f) => (f.id === itemId ? clampItem(patch(f, room), room) : f)),
    }));
  }

  function toPlanCoords(e: ReactPointerEvent) {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  function startDrag(
    e: ReactPointerEvent,
    roomId: string,
    itemId: string | null,
    originX: number,
    originY: number,
    mode: Drag["mode"] = "move"
  ) {
    e.stopPropagation();
    svgRef.current?.setPointerCapture(e.pointerId);
    svgRef.current?.focus({ preventScroll: true });
    const p = toPlanCoords(e);
    setSelection(itemId ? { kind: "item", roomId, itemId } : { kind: "room", roomId });
    historyKeyRef.current = `drag:${++dragCounterRef.current}`;
    setDrag({ mode, roomId, itemId, pointerId: e.pointerId, startX: p.x, startY: p.y, originX, originY });
  }

  function handlePointerMove(e: ReactPointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const room = rooms.find((r) => r.id === drag.roomId);
    if (!room) return;
    const p = toPlanCoords(e);
    const dx = p.x - drag.startX;
    const dy = p.y - drag.startY;

    if (drag.mode === "room-resize") {
      const fpW = Math.max(1, snapToGrid(drag.originX + dx));
      const fpH = Math.max(1, snapToGrid(drag.originY + dy));
      const turned = room.rotation === 90 || room.rotation === 270;
      const [lengthFt, widthFt] = turned ? [fpH, fpW] : [fpW, fpH];
      if (lengthFt !== room.lengthFt || widthFt !== room.widthFt) setRoomSizeFt(room.id, lengthFt, widthFt);
      return;
    }

    if (drag.mode === "opening-resize" && drag.openingId) {
      const opening = room.openings.find((o) => o.id === drag.openingId);
      const wall = opening?.wall ?? drag.wall;
      if (!opening || !wall) return;
      const len = wallLength(room, wall);
      const offset = opening.offset ?? drag.originY;
      const widthFt = Math.min(Math.max(snapToGrid(drag.originX + alongWall(dx, dy, room, wall)), 1), len - offset - 0.1);
      if (widthFt !== opening.widthFt || wall !== opening.wall) patchOpening(room.id, opening.id, { wall, offset, widthFt });
      return;
    }

    if (drag.mode === "opening" && drag.openingId) {
      const opening = room.openings.find((o) => o.id === drag.openingId);
      const wall = opening?.wall ?? drag.wall;
      if (!opening || !wall) return;
      const len = wallLength(room, wall);
      const width = Math.min(opening.widthFt || (opening.type === "door" ? 3 : 4), len - 0.2);
      const offset = Math.min(Math.max(snapToGrid(drag.originX + alongWall(dx, dy, room, wall)), 0.1), len - width - 0.1);
      // An auto-placed opening becomes pinned to its wall the moment it is actually moved.
      if (offset !== opening.offset || wall !== opening.wall) patchOpening(room.id, opening.id, { wall, offset });
      return;
    }

    if (drag.itemId && drag.mode === "resize") {
      const item = room.furniture.find((f) => f.id === drag.itemId);
      if (!item) return;
      const local = toLocalDelta(dx, dy, room.rotation);
      const fpW = snapToGrid(drag.originX + local.dx);
      const fpH = snapToGrid(drag.originY + local.dy);
      const turned = item.rotation === 90 || item.rotation === 270;
      const [w, h] = turned ? [fpH, fpW] : [fpW, fpH];
      if (w !== item.w || h !== item.h) patchItem(room.id, item.id, (f, r) => resizeItem(f, r, w, h));
      return;
    }

    if (drag.itemId) {
      const local = toLocalDelta(dx, dy, room.rotation);
      const x = snapToGrid(drag.originX + local.dx);
      const y = snapToGrid(drag.originY + local.dy);
      const item = room.furniture.find((f) => f.id === drag.itemId);
      // Unclamped while dragging so furniture can be carried into another room; settled on drop.
      if (item && (item.x !== x || item.y !== y)) {
        patchRoom(room.id, (r) => ({ furniture: r.furniture.map((f) => (f.id === item.id ? { ...f, x, y } : f)) }));
      }
      return;
    }

    const { w, h } = footprint(room);
    const others = rooms.filter((r) => r.id !== room.id);
    const x = snapToEdges(snapToGrid(drag.originX + dx), w, others.flatMap((r) => [r.x, r.x + footprint(r).w]));
    const y = snapToEdges(snapToGrid(drag.originY + dy), h, others.flatMap((r) => [r.y, r.y + footprint(r).h]));
    if (x !== room.x || y !== room.y) patchRoom(room.id, () => ({ x, y }));
  }

  function endDrag(e: ReactPointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    setDrag(null);
    historyKeyRef.current = null;
    if (drag.itemId && drag.mode === "move") dropItem(drag.roomId, drag.itemId);
    else if (!drag.itemId && drag.mode !== "opening" && drag.mode !== "opening-resize") setFrame(frameFor(rooms, passage));
  }

  function setItemSize(field: "w" | "h", value: number) {
    if (!selectedRoom || !selectedItem) return;
    const { id } = selectedItem;
    withHistoryKey(`item-size:${id}:${field}`, () =>
      patchItem(selectedRoom.id, id, (f, r) => resizeItem(f, r, field === "w" ? value : f.w, field === "h" ? value : f.h))
    );
  }

  function handleAddChoice(value: string) {
    const [kind, key] = value.split(":");
    if (kind === "area") addArea(key);
    else if (kind === "item") addFurniture(key as FurnitureType);
  }


  /** Keeps a dropped item in its room, or hands it to the room it was dropped into. */
  function dropItem(roomId: string, itemId: string) {
    const from = rooms.find((r) => r.id === roomId);
    const item = from?.furniture.find((f) => f.id === itemId);
    if (!from || !item) return;
    const f = footprint(item);
    const center = localToPlan(from, item.x + f.w / 2, item.y + f.h / 2);
    const under = rooms.filter((r) => containsPoint(r, center.x, center.y));
    const target = under.find((r) => r.id === from.id) ?? under.filter((r) => !isPassage(r)).at(-1) ?? under.at(-1);

    if (!target || target.id === from.id) {
      const settled = clampItem(item, from);
      if (settled.x !== item.x || settled.y !== item.y) patchItem(from.id, item.id, () => settled);
      return;
    }
    // Default furniture ids ("bed", "wc"…) repeat across rooms, so keep ids unique within the target room.
    const id = target.furniture.some((f) => f.id === item.id) ? crypto.randomUUID() : item.id;
    const moved = { ...transferItem(item, from, target), id };
    commit(
      rooms.map((r) => {
        if (r.id === from.id) return { ...r, furniture: r.furniture.filter((it) => it.id !== item.id) };
        if (r.id === target.id) return { ...r, furniture: [...r.furniture, moved] };
        return r;
      })
    );
    setSelection({ kind: "item", roomId: target.id, itemId: id });
  }

  function rotateSelection() {
    if (!selectedRoom) return;
    if (selectedOpening) {
      rotateOpening();
      return;
    }
    if (selectedItem) {
      patchItem(selectedRoom.id, selectedItem.id, (f) => {
        const before = footprint(f);
        const rotation = nextRotation(f.rotation);
        const after = footprint({ ...f, rotation });
        return { ...f, rotation, x: snapToGrid(f.x + (before.w - after.w) / 2), y: snapToGrid(f.y + (before.h - after.h) / 2) };
      });
      return;
    }
    patchRoom(
      selectedRoom.id,
      (r) => {
        const before = footprint(r);
        const rotation = nextRotation(r.rotation);
        const after = footprint({ ...r, rotation });
        return { rotation, x: snapToGrid(r.x + (before.w - after.w) / 2), y: snapToGrid(r.y + (before.h - after.h) / 2) };
      },
      true
    );
  }

  /** Resize from the plan (feet); the Room Measurements value is kept in the room's own unit. */
  function setRoomSizeFt(roomId: string, lengthFt: number, widthFt: number) {
    const toUnit = (ft: number, unit: FloorPlanRoom["unitSystem"]) =>
      unit === "metric" ? Math.round((ft / 3.28084) * 100) / 100 : ft;
    patchRoom(roomId, (r) => {
      const next = { ...r, lengthFt, widthFt, length: toUnit(lengthFt, r.unitSystem), width: toUnit(widthFt, r.unitSystem) };
      return { ...next, furniture: r.furniture.map((f) => clampItem(f, next)) };
    });
  }

  function patchOpening(roomId: string, openingId: string, patch: Partial<PlanOpening>) {
    patchRoom(roomId, (r) => ({ openings: r.openings.map((o) => (o.id === openingId ? { ...o, ...patch } : o)) }));
  }

  function toggleWallTool() {
    setWallTool((on) => !on);
    setHoverPiece(null);
    setSelection(null);
  }

  /** Removes the piece of wall around the clicked point (between the nearest wall junctions). */
  function removeWallPiece(e: ReactPointerEvent, seg: WallSegment) {
    e.stopPropagation();
    const room = rooms.find((r) => r.id === seg.roomId);
    if (!room) return;
    const p = toPlanCoords(e);
    const gap = toWallGap(room, wallPieceAt(rooms, seg, p.x, p.y));
    if (!gap) return;
    setHoverPiece(null);
    patchRoom(room.id, (r) => ({ wallGaps: [...r.wallGaps, gap] }));
  }

  function restoreWallPiece(e: ReactPointerEvent, roomId: string, index: number) {
    e.stopPropagation();
    patchRoom(roomId, (r) => ({ wallGaps: r.wallGaps.filter((_, k) => k !== index) }));
  }

  function setWindowFullHeight(fullHeight: boolean) {
    if (!selectedRoom || !selectedOpening) return;
    patchOpening(selectedRoom.id, selectedOpening.id, { fullHeight });
  }

  /** Starts dragging a door/window along its wall; an auto-placed one is pinned where it is drawn. */
  function startOpeningDrag(e: ReactPointerEvent, room: FloorPlanRoom, placed: ResolvedOpening, mode: "opening" | "opening-resize" = "opening") {
    if (!placed.opening.movable) {
      e.stopPropagation();
      setSelection({ kind: "opening", roomId: room.id, openingId: placed.opening.id });
      return;
    }
    e.stopPropagation();
    svgRef.current?.setPointerCapture(e.pointerId);
    svgRef.current?.focus({ preventScroll: true });
    const p = toPlanCoords(e);
    setSelection({ kind: "opening", roomId: room.id, openingId: placed.opening.id });
    historyKeyRef.current = `drag:${++dragCounterRef.current}`;
    setDrag({
      mode,
      roomId: room.id,
      itemId: null,
      openingId: placed.opening.id,
      wall: placed.wall,
      pointerId: e.pointerId,
      startX: p.x,
      startY: p.y,
      originX: mode === "opening" ? placed.offset : placed.width,
      originY: placed.offset,
    });
  }

  function moveOpeningToSide(side: Wall) {
    if (!selectedRoom || !selectedOpening) return;
    const wall = toOwnWall(side, selectedRoom.rotation);
    const len = wallLength(selectedRoom, wall);
    const width = Math.min(selectedOpening.widthFt || 3, len - 0.2);
    patchOpening(selectedRoom.id, selectedOpening.id, { wall, offset: Math.max(0.1, snapToGrid((len - width) / 2)) });
  }

  function setOpeningWidth(widthFt: number) {
    if (!selectedRoom || !selectedOpening) return;
    const room = selectedRoom;
    const opening = selectedOpening;
    withHistoryKey(`opening-width:${opening.id}`, () => {
      const placed = resolveOpenings(room, sharedWallsByRoom.get(room.id) ?? new Set()).find((p) => p.opening.id === opening.id);
      const wall = opening.wall ?? placed?.wall;
      if (!wall) return;
      const offset = opening.offset ?? placed?.offset ?? 0.1;
      patchOpening(room.id, opening.id, { wall, offset, widthFt: Math.min(widthFt, wallLength(room, wall) - offset - 0.1) });
    });
  }

  /** Doors: turn the swing a quarter (hinge side / opening direction). Windows: move to the next wall clockwise. */
  function rotateOpening() {
    if (!selectedRoom || !selectedOpening?.movable) return;
    const room = selectedRoom;
    const opening = selectedOpening;
    const placed = resolveOpenings(room, sharedWallsByRoom.get(room.id) ?? new Set()).find((p) => p.opening.id === opening.id);
    const wall = opening.wall ?? placed?.wall;
    if (!wall) return;
    if (opening.type === "door") {
      patchOpening(room.id, opening.id, {
        wall,
        offset: opening.offset ?? placed?.offset ?? 0.1,
        swing: ((opening.swing + 1) % 4) as DoorSwing,
      });
      return;
    }
    const start = WALLS.indexOf(wall);
    const next = [1, 2, 3].map((k) => WALLS[(start + k) % 4]).find((w) => !room.openWalls.includes(w));
    if (!next) return;
    const len = wallLength(room, next);
    const width = Math.min(opening.widthFt || 4, len - 0.2);
    patchOpening(room.id, opening.id, { wall: next, offset: Math.max(0.1, snapToGrid((len - width) / 2)), widthFt: width });
  }

  function addOpening(type: "door" | "window", fullHeight = false) {
    if (!selectedRoom) return;
    const room = selectedRoom;
    const shared = sharedWallsByRoom.get(room.id) ?? new Set<Wall>();
    const walled = WALLS.filter((w) => !room.openWalls.includes(w));
    if (walled.length === 0) {
      toast.error("This room has no walls — close a side first");
      return;
    }
    const preferred = walled.filter((w) => (type === "door" ? shared.has(w) : !shared.has(w)));
    const wall = (preferred.length > 0 ? preferred : walled)[0];
    const widthFt = type === "door" ? 3 : 4;
    const len = wallLength(room, wall);
    const fitted = Math.min(widthFt, len - 0.2);
    startTransition(async () => {
      if (!(await saveIfDirty())) return;
      const result = await addFloorPlanOpening(projectId, {
        roomId: room.id,
        type,
        widthFt: fitted,
        heightFt: type === "door" ? 7 : fullHeight ? room.heightFt : 4,
        wall,
        offset: Math.max(0.1, (len - fitted) / 2),
        fullHeight: type === "window" && fullHeight,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${type === "door" ? "Door" : fullHeight ? "Full-height window" : "Window"} added to ${room.name} — drag it along the wall or pick another wall`);
      router.refresh();
    });
  }

  function removeSelectedOpening() {
    if (!selectedRoom || !selectedOpening) return;
    const { rowId } = selectedOpening;
    const roomId = selectedRoom.id;
    startTransition(async () => {
      if (!(await saveIfDirty())) return;
      const result = await deleteOpening(rowId, roomId, projectId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSelection(null);
      toast.success("Removed — also removed from Room Measurements");
      router.refresh();
    });
  }

  function resizeRoom(roomId: string, field: "length" | "width", value: number) {
    withHistoryKey(`size:${roomId}:${field}`, () => resizeRoomNow(roomId, field, value));
  }

  function resizeRoomNow(roomId: string, field: "length" | "width", value: number) {
    patchRoom(
      roomId,
      (r) => {
        const feet = toStandardFeet(value, r.unitSystem);
        const sized = field === "length" ? { length: value, lengthFt: feet } : { width: value, widthFt: feet };
        const next = { ...r, ...sized };
        return { ...sized, furniture: r.furniture.map((f) => clampItem(f, next)) };
      },
      true
    );
  }

  function toggleOpenSide(side: Wall) {
    if (!selectedRoom) return;
    const own = toOwnWall(side, selectedRoom.rotation);
    patchRoom(selectedRoom.id, (r) => ({
      openWalls: r.openWalls.includes(own) ? r.openWalls.filter((w) => w !== own) : [...r.openWalls, own],
    }));
  }

  function changePassage(side: keyof PlanPassage, feet: number) {
    const next = { ...passage, [side]: feet };
    withHistoryKey(`passage:${side}`, record);
    setPassage(next);
    setFrame(frameFor(rooms, next));
  }

  function addFurniture(type: FurnitureType) {
    if (!selectedRoom) return;
    const item = newFurnitureItem(type, selectedRoom, crypto.randomUUID());
    patchRoom(selectedRoom.id, (r) => ({ furniture: [...r.furniture, item] }));
    setSelection({ kind: "item", roomId: selectedRoom.id, itemId: item.id });
  }

  function deleteSelectedItem() {
    if (!selectedRoom || !selectedItem) return;
    patchRoom(selectedRoom.id, (r) => ({ furniture: r.furniture.filter((f) => f.id !== selectedItem.id) }));
    setSelection({ kind: "room", roomId: selectedRoom.id });
  }

  function setCounterShape(shape: "counter_l" | "counter_straight") {
    if (!selectedRoom || !selectedItem) return;
    patchItem(selectedRoom.id, selectedItem.id, (f, room) => ({
      ...f,
      type: shape,
      h: shape === "counter_straight" ? 2 : Math.max(4, Math.min(8, room.widthFt - 0.4 - f.y)),
    }));
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (wallTool && e.key === "Escape") {
      toggleWallTool();
      return;
    }
    if (!selectedRoom) return;
    if (selection?.kind === "opening") {
      if (e.key === "Escape") setSelection(null);
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        rotateOpening();
      }
      return;
    }
    const step = e.shiftKey ? 1 : GRID_FT;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      if (selectedItem) {
        const local = toLocalDelta(dx, dy, selectedRoom.rotation);
        patchItem(selectedRoom.id, selectedItem.id, (f) => ({ ...f, x: f.x + local.dx, y: f.y + local.dy }));
      } else {
        patchRoom(selectedRoom.id, (r) => ({ x: r.x + dx, y: r.y + dy }));
      }
    } else if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      rotateSelection();
    } else if ((e.key === "Delete" || e.key === "Backspace") && selectedItem) {
      e.preventDefault();
      deleteSelectedItem();
    } else if (e.key === "Escape") {
      setSelection(null);
    }
  }

  function discardChanges() {
    record();
    restore(baseline);
    setResetCount((n) => n + 1);
  }

  /** The current layout, shifted so the plan starts at 0,0 (that's how it's stored). */
  function layoutPayload() {
    const minX = Math.min(...rooms.map((r) => r.x));
    const minY = Math.min(...rooms.map((r) => r.y));
    const initialById = new Map(baseline.rooms.map((r) => [r.id, r]));
    return {
      minX,
      minY,
      payload: {
        passage,
        rooms: rooms.map((r) => {
          const before = initialById.get(r.id);
          const resized = before && (before.length !== r.length || before.width !== r.width);
          return {
            id: r.id,
            x: r.x - minX,
            y: r.y - minY,
            rotation: r.rotation,
            openWalls: r.openWalls,
            wallGaps: r.wallGaps,
            furniture: r.furniture,
            ...(resized ? { size: { length: r.length, width: r.width } } : {}),
          };
        }),
        openings: changedOpenings(),
      },
    };
  }

  function changedOpenings() {
    const before = new Map(baseline.rooms.flatMap((r) => r.openings.map((o) => [o.id, o] as const)));
    return rooms.flatMap((r) =>
      r.openings.flatMap((o) => {
        const was = before.get(o.id);
        if (!o.movable || !o.wall || o.offset == null || !was) return [];
        const widthChanged = was.widthFt !== o.widthFt;
        const unchanged = was.wall === o.wall && was.offset === o.offset && was.swing === o.swing && was.fullHeight === o.fullHeight;
        if (unchanged && !widthChanged) return [];
        return [
          {
            id: o.rowId,
            roomId: r.id,
            wall: o.wall,
            offset: o.offset,
            swing: o.swing,
            fullHeight: o.fullHeight,
            ...(widthChanged ? { widthFt: o.widthFt } : {}),
          },
        ];
      })
    );
  }

  /** The current layout becomes the "saved" version that unsaved changes are measured against. */
  function markSaved() {
    dirtyRef.current = false;
    setBaseline({ rooms, passage });
  }

  /** Saves unsaved edits first so adding or removing an area doesn't throw them away. */
  async function saveIfDirty(): Promise<boolean> {
    if (!dirty) return true;
    const result = await saveFloorPlanLayout(projectId, layoutPayload().payload);
    if (result.error) toast.error(result.error);
    else markSaved();
    return !result.error;
  }

  function save() {
    startTransition(async () => {
      const result = await saveFloorPlanLayout(projectId, layoutPayload().payload);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      markSaved();
      toast.success("Floor plan saved — room sizes updated on Room Measurements too");
      router.refresh();
    });
  }

  function saveAndLeave() {
    const target = leaveTarget;
    if (!target) return;
    startTransition(async () => {
      const result = await saveFloorPlanLayout(projectId, layoutPayload().payload);
      if (result.error) {
        toast.error(`Your changes couldn't be saved: ${result.error}`);
        return;
      }
      markSaved();
      setLeaveTarget(null);
      toast.success("Floor plan saved");
      router.push(target);
    });
  }

  function leaveWithoutSaving() {
    const target = leaveTarget;
    if (!target) return;
    markSaved();
    setLeaveTarget(null);
    router.push(target);
  }

  function addArea(key: string) {
    const preset = PLAN_AREA_PRESETS.find((p) => p.key === key);
    if (!preset) return;
    const base = preset.label.split(" / ")[0];
    const taken = new Set(rooms.map((r) => r.name.toLowerCase()));
    let name = base;
    for (let i = 2; taken.has(name.toLowerCase()); i++) name = `${base} ${i}`;
    const { minX, minY } = layoutPayload();
    const b = boundsOf(rooms);
    startTransition(async () => {
      if (!(await saveIfDirty())) return;
      const result = await addFloorPlanArea(projectId, {
        category: preset.category,
        name,
        lengthFt: preset.lengthFt,
        widthFt: preset.widthFt,
        x: b.maxX - minX + 1,
        y: b.minY - minY,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${name} added on the right of the plan — drag it into place and set its size`);
      router.refresh();
    });
  }

  function removeSelectedRoom() {
    if (!selectedRoom) return;
    if (!window.confirm(`Remove "${selectedRoom.name}"? It is also deleted from Room Measurements.`)) return;
    const roomId = selectedRoom.id;
    startTransition(async () => {
      if (!(await saveIfDirty())) return;
      const result = await deleteRoom(roomId, projectId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSelection(null);
      toast.success("Room removed");
      router.refresh();
    });
  }

  /** Re-lays every room out automatically with default furniture — local and undoable, saved with Save layout. */
  function resetToAuto() {
    const fresh = rooms.map((r) => {
      const unrotated = { ...r, rotation: 0 as PlanRotation, openWalls: [] };
      return { ...unrotated, furniture: defaultFurniture(unrotated) };
    });
    const arranged = autoArrange(fresh);
    const order = new Map(rooms.map((r, i) => [r.id, i]));
    commit(arranged.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)), true);
    setSelection(null);
    toast.success("Rooms re-arranged automatically — use Undo to go back");
  }


  useEffect(() => {
    dirtyRef.current = dirty;
    payloadRef.current = () => layoutPayload().payload;
  });

  useEffect(() => {
    lastHistoryKeyRef.current = null;
  }, [selection]);

  // Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl+Y redo — except while typing in a field.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Closing the tab, reloading or typing a new address: the browser shows its own "Leave site?" prompt.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Clicking any link inside the app (sidebar, header, project links): ask before leaving.
  useEffect(() => {
    if (!dirty) return;
    const intercept = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveTarget(url.pathname + url.search + url.hash);
    };
    document.addEventListener("click", intercept, true);
    return () => document.removeEventListener("click", intercept, true);
  }, [dirty]);

  // Any other way of leaving (browser back/forward, search, sign-out): save automatically on the way out.
  useEffect(
    () => () => {
      if (!dirtyRef.current) return;
      void saveFloorPlanLayout(projectId, payloadRef.current()).then((result) => {
        if (result.error) toast.error(`Your floor plan changes couldn't be saved: ${result.error}`);
        else toast.success("Your floor plan changes were saved automatically");
      });
    },
    [projectId]
  );

  const labelSize = (r: FloorPlanRoom) => {
    const { w, h } = footprint(r);
    return Math.max(0.28, Math.min(0.5, Math.min(w, h) * 0.08));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={save} disabled={!dirty || pending}>
          <Save className="size-4" /> {pending ? "Saving..." : "Save layout"}
        </Button>
        <div className="flex items-center rounded-md border">
          <Button size="sm" variant="ghost" onClick={undo} disabled={past.length === 0 || pending} title="Undo (Ctrl/⌘+Z)" aria-label="Undo">
            <Undo2 className="size-4" /> Undo
          </Button>
          <Button size="sm" variant="ghost" onClick={redo} disabled={future.length === 0 || pending} title="Redo (Ctrl/⌘+Shift+Z)" aria-label="Redo">
            <Redo2 className="size-4" /> Redo
          </Button>
        </div>
        <Button size="sm" variant="ghost" onClick={discardChanges} disabled={!dirty || pending}>
          <RotateCcw className="size-4" /> Discard changes
        </Button>
        <Button size="sm" variant="ghost" onClick={resetToAuto} disabled={pending}>
          <LayoutGrid className="size-4" /> Auto-arrange
        </Button>
        <Button
          size="sm"
          variant={wallTool ? "secondary" : "ghost"}
          aria-pressed={wallTool}
          onClick={toggleWallTool}
          disabled={pending}
          title="Click a piece of wall to remove it; click a removed (dashed) piece to put it back"
        >
          <Scissors className="size-4" /> {wallTool ? "Done removing walls" : "Remove wall"}
        </Button>
        <select
          aria-label="Add area or furniture"
          className="h-7 rounded-md border bg-background px-2 text-[0.8rem]"
          value=""
          disabled={pending}
          onChange={(e) => {
            if (e.target.value) handleAddChoice(e.target.value);
          }}
        >
          <option value="">+ Add area or furniture…</option>
          <optgroup label="Areas (passage, WC…)">
            {PLAN_AREA_PRESETS.map((p) => (
              <option key={p.key} value={`area:${p.key}`}>
                {p.label}
              </option>
            ))}
          </optgroup>
          <optgroup label={selectedRoom ? `Furniture → ${selectedRoom.name}` : "Furniture (select a room first)"}>
            {FURNITURE_TYPES.map((t) => (
              <option key={t} value={`item:${t}`} disabled={!selectedRoom}>
                {FURNITURE_LABELS[t]}
              </option>
            ))}
          </optgroup>
        </select>
        {dirty && !pending && <span className="text-xs font-medium text-amber-700">Unsaved changes</span>}
      </div>
      {wallTool && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          Remove wall: click any piece of wall to take it out — it splits where other walls meet it, so you can remove just
          the short bit between two rooms. Removed pieces show as red dashes; click one to put the wall back. Press Esc or
          “Done removing walls” when finished, then Save layout.
        </p>
      )}

      <SelectionPanel
        key={`${selection?.roomId ?? "none"}-${selection?.kind === "item" ? selection.itemId : selection?.kind === "opening" ? selection.openingId : ""}-${resetCount}`}
        room={selectedRoom}
        item={selectedItem}
        disabled={pending}
        onRotate={rotateSelection}
        onResize={resizeRoom}
        onItemSize={setItemSize}
        onDeleteItem={deleteSelectedItem}
        onCounterShape={setCounterShape}
        onToggleOpenSide={toggleOpenSide}
        onRemoveRoom={removeSelectedRoom}
        opening={selectedOpening}
        onAddOpening={addOpening}
        onOpeningSide={moveOpeningToSide}
        onOpeningWidth={setOpeningWidth}
        onRemoveOpening={removeSelectedOpening}
        onWindowFullHeight={setWindowFullHeight}
        passage={passage}
        onPassageChange={changePassage}
      />

      <div className="overflow-hidden rounded-lg border" style={{ background: PAPER }}>
        <svg
          ref={svgRef}
          viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
          className="block h-auto max-h-[78vh] w-full outline-none select-none"
          role="application"
          aria-label="Editable 2D floor plan. Select a room or a piece of furniture, then drag it, rotate with R, or nudge with the arrow keys."
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerDown={() => setSelection(null)}
        >
          <PlanDefs />
          <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} fill={PAPER} />
          {WALLS.some((side) => passage[side] > 0) && <PassageArea bounds={boundsOf(rooms)} passage={passage} />}
          <PlanTitle rooms={rooms} passage={passage} projectName={projectName} />

          {[...rooms].sort((a, b) => Number(isPassage(b)) - Number(isPassage(a))).map((room) => {
            const { w, h } = footprint(room);
            const roomSelected = selection?.kind === "room" && selection.roomId === room.id;
            return (
              <g key={`floor-${room.id}`} transform={`translate(${room.x} ${room.y})`}>
                <rect
                  width={w}
                  height={h}
                  fill={FLOOR_FILL[floorKind(room)]}
                  onPointerDown={(e) => startDrag(e, room.id, null, room.x, room.y)}
                  className={drag?.roomId === room.id && !drag.itemId ? "cursor-grabbing" : "cursor-grab"}
                  style={{ touchAction: "none" }}
                />
                {roomSelected && <rect width={w} height={h} fill="#f59e0b26" pointerEvents="none" />}
              </g>
            );
          })}

          {rooms.map((room) => (
            <g key={`furniture-${room.id}`} transform={`translate(${room.x} ${room.y}) ${localTransform(room)}`}>
              {drawOrder(room.furniture).map((item) => {
                const itemSelected = selection?.kind === "item" && selection.roomId === room.id && selection.itemId === item.id;
                return (
                  <g
                    key={item.id}
                    transform={`translate(${item.x} ${item.y}) ${rotationTransform(item.w, item.h, item.rotation)}`}
                    onPointerDown={(e) => startDrag(e, room.id, item.id, item.x, item.y)}
                    className="cursor-move"
                    style={{ touchAction: "none" }}
                  >
                    <FurnitureShape item={item} />
                    {itemSelected && (
                      <rect
                        x={-0.12}
                        y={-0.12}
                        width={item.w + 0.24}
                        height={item.h + 0.24}
                        fill="none"
                        stroke={SELECT_COLOR}
                        strokeWidth={0.05}
                        strokeDasharray="0.25 0.15"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          ))}

          <g pointerEvents="none" stroke={WALL_COLOR} strokeWidth={WALL_FT} strokeLinecap="square">
            {walls.map((seg, i) => (
              <line key={i} x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} />
            ))}
          </g>

          {rooms.map((room) => {
            const floor = FLOOR_FILL[floorKind(room)];
            return (
              <g key={`open-${room.id}`} transform={`translate(${room.x} ${room.y}) ${localTransform(room)}`}>
                {resolveOpenings(room, sharedWallsByRoom.get(room.id) ?? new Set()).map((placed) => {
                  const selected = selection?.kind === "opening" && selection.openingId === placed.opening.id;
                  const swing = placed.opening.type === "door" ? placed.width : 0;
                  return (
                    <g
                      key={placed.opening.id}
                      transform={wallFrameTransform(placed.wall, room.lengthFt, room.widthFt)}
                      onPointerDown={(e) => startOpeningDrag(e, room, placed)}
                      className={placed.opening.movable ? "cursor-ew-resize" : "cursor-pointer"}
                      style={{ touchAction: "none" }}
                    >
                      <OpeningShape
                        type={placed.opening.type}
                        offset={placed.offset}
                        width={placed.width}
                        swing={placed.opening.swing}
                        fullHeight={placed.opening.fullHeight}
                        floor={floor}
                        selected={selected}
                      />
                      <rect
                        x={placed.offset}
                        y={placed.opening.swing >= 2 ? -0.45 - swing * 0.5 : -0.45}
                        width={placed.width}
                        height={0.9 + swing * 0.5}
                        fill="transparent"
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {wallTool && (
            <g>
              {walls.map((seg, i) => (
                <line
                  key={`hit-${i}`}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke="transparent"
                  strokeWidth={0.8}
                  className="cursor-pointer"
                  style={{ touchAction: "none" }}
                  onPointerMove={(e) => {
                    const p = toPlanCoords(e);
                    setHoverPiece(wallPieceAt(rooms, seg, p.x, p.y));
                  }}
                  onPointerLeave={() => setHoverPiece(null)}
                  onPointerDown={(e) => removeWallPiece(e, seg)}
                />
              ))}
              {hoverPiece && (
                <line
                  pointerEvents="none"
                  {...(hoverPiece.horizontal
                    ? { x1: hoverPiece.from, y1: hoverPiece.at, x2: hoverPiece.to, y2: hoverPiece.at }
                    : { x1: hoverPiece.at, y1: hoverPiece.from, x2: hoverPiece.at, y2: hoverPiece.to })}
                  stroke="#dc2626"
                  strokeOpacity={0.75}
                  strokeWidth={WALL_FT + 0.1}
                />
              )}
              {rooms.flatMap((room) =>
                room.wallGaps.map((gap, k) => {
                  const l = wallGapLine(room, gap);
                  const ends = l.horizontal
                    ? { x1: l.from, y1: l.at, x2: l.to, y2: l.at }
                    : { x1: l.at, y1: l.from, x2: l.at, y2: l.to };
                  return (
                    <g key={`gap-${room.id}-${k}`} className="cursor-pointer" onPointerDown={(e) => restoreWallPiece(e, room.id, k)}>
                      <title>Click to put this wall back</title>
                      <line {...ends} stroke="#dc2626" strokeWidth={0.07} strokeDasharray="0.3 0.2" />
                      <line {...ends} stroke="transparent" strokeWidth={0.8} style={{ touchAction: "none" }} />
                    </g>
                  );
                })
              )}
            </g>
          )}

          {rooms.map((room) => {
            const fs = labelSize(room);
            const sizeText = `${formatFeetInches(room.lengthFt)} x ${formatFeetInches(room.widthFt)}`;
            const labelW = Math.max(room.name.length * fs * 0.72, sizeText.length * fs * 0.85 * 0.58);
            const anchor = labelAnchor(room, labelW, fs * 2.4, rooms);
            const cx = anchor.x;
            const cy = anchor.y - fs * 0.35;
            const darkFloor = ["granite", "walnut", "concrete"].includes(floorKind(room));
            const [ink, subInk, halo] = darkFloor ? ["#ffffff", "#f1ede6", "#1f1f1fb3"] : ["#2b2b2b", "#3a3a3a", "#fbf8f3b3"];
            return (
              <g key={`label-${room.id}`} pointerEvents="none" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle">
                <text x={cx} y={cy} fontSize={fs} fontWeight={700} fill={ink} stroke={halo} strokeWidth={fs * 0.2} paintOrder="stroke" letterSpacing={0.02}>
                  {room.name.toUpperCase()}
                </text>
                <text x={cx} y={cy + fs * 1.2} fontSize={fs * 0.85} fontWeight={600} fill={subInk} stroke={halo} strokeWidth={fs * 0.2} paintOrder="stroke">
                  {sizeText}
                </text>
              </g>
            );
          })}

          {selectedRoom && selectedItem && (
            <g transform={`translate(${selectedRoom.x} ${selectedRoom.y}) ${localTransform(selectedRoom)}`}>
              <circle
                cx={selectedItem.x + footprint(selectedItem).w}
                cy={selectedItem.y + footprint(selectedItem).h}
                r={0.32}
                fill="#fff"
                stroke={SELECT_COLOR}
                strokeWidth={0.08}
                className="cursor-nwse-resize"
                style={{ touchAction: "none" }}
                aria-label={`Resize ${FURNITURE_LABELS[selectedItem.type]}`}
                onPointerDown={(e) => {
                  const fp = footprint(selectedItem);
                  startDrag(e, selectedRoom.id, selectedItem.id, fp.w, fp.h, "resize");
                }}
              />
            </g>
          )}

          {selectedRoom && selectedOpening?.movable && (() => {
            const placed = resolveOpenings(selectedRoom, sharedWallsByRoom.get(selectedRoom.id) ?? new Set()).find(
              (p) => p.opening.id === selectedOpening.id
            );
            if (!placed) return null;
            return (
              <g
                transform={`translate(${selectedRoom.x} ${selectedRoom.y}) ${localTransform(selectedRoom)} ${wallFrameTransform(
                  placed.wall,
                  selectedRoom.lengthFt,
                  selectedRoom.widthFt
                )}`}
              >
                <circle
                  cx={placed.offset + placed.width}
                  cy={0}
                  r={0.3}
                  fill="#fff"
                  stroke={SELECT_COLOR}
                  strokeWidth={0.08}
                  className="cursor-ew-resize"
                  style={{ touchAction: "none" }}
                  aria-label={`Resize ${selectedOpening.type}`}
                  onPointerDown={(e) => startOpeningDrag(e, selectedRoom, placed, "opening-resize")}
                />
              </g>
            );
          })()}

          {selection?.kind === "room" && selectedRoom && (
            <rect
              x={selectedRoom.x - WALL_FT}
              y={selectedRoom.y - WALL_FT}
              width={footprint(selectedRoom).w + WALL_FT * 2}
              height={footprint(selectedRoom).h + WALL_FT * 2}
              fill="none"
              stroke={SELECT_COLOR}
              strokeWidth={0.06}
              strokeDasharray="0.4 0.25"
              pointerEvents="none"
            />
          )}
          {selection?.kind === "room" && selectedRoom && (
            <circle
              cx={selectedRoom.x + footprint(selectedRoom).w}
              cy={selectedRoom.y + footprint(selectedRoom).h}
              r={0.42}
              fill="#fff"
              stroke={SELECT_COLOR}
              strokeWidth={0.1}
              className="cursor-nwse-resize"
              style={{ touchAction: "none" }}
              aria-label={`Resize ${selectedRoom.name}`}
              onPointerDown={(e) => {
                const fp = footprint(selectedRoom);
                startDrag(e, selectedRoom.id, null, fp.w, fp.h, "room-resize");
              }}
            />
          )}
        </svg>
      </div>

      <AlertDialog open={leaveTarget !== null} onOpenChange={(open) => !open && !pending && setLeaveTarget(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Save your floor plan changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to this floor plan. Save them before you continue, or discard them to keep the last
              saved version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Stay on this page</AlertDialogCancel>
            <Button variant="ghost" onClick={leaveWithoutSaving} disabled={pending}>
              Discard changes
            </Button>
            <Button onClick={saveAndLeave} disabled={pending}>
              {pending ? "Saving..." : "Save and continue"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Title, overall plot size and the overall width/depth dimension lines around the plan. */
function PlanTitle({ rooms, passage, projectName }: { rooms: FloorPlanRoom[]; passage: PlanPassage; projectName: string }) {
  const { plot: b, outer } = plotBounds(rooms, passage);
  const width = formatFeetInches(b.maxX - b.minX);
  const depth = formatFeetInches(b.maxY - b.minY);
  const cx = (b.minX + b.maxX) / 2;
  const dimY = outer.minY - 1.4;
  const dimX = outer.minX - 1.6;
  return (
    <g pointerEvents="none" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle">
      <text x={cx} y={outer.minY - 3.9} fontSize={0.85} fontWeight={800} fill="#1f1f1f" letterSpacing={0.03}>
        {projectName.toUpperCase()} — FLOOR PLAN
      </text>
      <text x={cx} y={outer.minY - 3.0} fontSize={0.55} fill="#4a4a4a" letterSpacing={0.03}>
        PLOT SIZE: {width.replace(/-0"$/, "")} x {depth.replace(/-0"$/, "")}
      </text>
      <DimensionLine x1={b.minX} y1={dimY} x2={b.maxX} y2={dimY} label={width} />
      <DimensionLine x1={dimX} y1={b.minY} x2={dimX} y2={b.maxY} label={depth} vertical />
    </g>
  );
}

const PANEL = "flex min-h-[8.5rem] flex-col justify-center gap-2 rounded-lg border px-3 py-2";
const SIDE_LABELS: Record<Wall, string> = { top: "Top", right: "Right", bottom: "Bottom", left: "Left" };

function SelectionPanel({
  room,
  item,
  disabled,
  onRotate,
  onResize,
  onItemSize,
  onDeleteItem,
  onCounterShape,
  onToggleOpenSide,
  onRemoveRoom,
  opening,
  onAddOpening,
  onOpeningSide,
  onOpeningWidth,
  onRemoveOpening,
  onWindowFullHeight,
  passage,
  onPassageChange,
}: {
  room: FloorPlanRoom | null;
  item: FurnitureItem | null;
  disabled: boolean;
  onRotate: () => void;
  onResize: (roomId: string, field: "length" | "width", value: number) => void;
  onItemSize: (field: "w" | "h", value: number) => void;
  onDeleteItem: () => void;
  onCounterShape: (shape: "counter_l" | "counter_straight") => void;
  onToggleOpenSide: (side: Wall) => void;
  onRemoveRoom: () => void;
  opening: PlanOpening | null;
  onAddOpening: (type: "door" | "window", fullHeight?: boolean) => void;
  onOpeningSide: (side: Wall) => void;
  onOpeningWidth: (widthFt: number) => void;
  onRemoveOpening: () => void;
  onWindowFullHeight: (fullHeight: boolean) => void;
  passage: PlanPassage;
  onPassageChange: (side: keyof PlanPassage, feet: number) => void;
}) {
  if (!room) {
    return (
      <div className={`${PANEL} border-dashed text-xs text-muted-foreground`}>
        <p>
          Click a room to move or resize it, or to open its walls. Drag rooms onto each other to join them — the wall between
          them disappears. Click furniture to move, rotate or remove it. Keys: arrows nudge (Shift = 1 ft), R rotates, Delete
          removes furniture. Drag furniture into another room or a passage to move it there. Use “+ Add area or
          furniture” for passages, extra WCs, balconies and furniture.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <span className="pb-2 text-sm font-medium text-foreground">Outside passage (ft)</span>
          {WALLS.map((side) => (
            <DimensionInput
              key={side}
              label={SIDE_LABELS[side]}
              value={passage[side]}
              allowZero
              onCommit={(v) => onPassageChange(side, v)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    );
  }

  if (opening) {
    const label = opening.type === "door" ? "Door" : opening.fullHeight ? "Full-height window" : "Window";
    return (
      <div className={`${PANEL} bg-muted/30`}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {label} in {room.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {opening.movable
                ? "Drag to move along the wall, drag the end dot to resize, Rotate to turn it (R)"
                : "Added on Room Measurements with a quantity above 1 — edit it there, or add single doors/windows here"}
            </span>
          </div>
          {opening.movable && (
            <DimensionInput label="Width (ft)" value={opening.widthFt} onCommit={onOpeningWidth} disabled={disabled} />
          )}
          {opening.movable && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onRotate}
                disabled={disabled}
                title={opening.type === "door" ? "Turn the door swing (hinge side / opening direction)" : "Move to the next wall"}
              >
                <RotateCw className="size-4" /> Rotate
              </Button>
              <Button size="sm" variant="outline" onClick={onRemoveOpening} disabled={disabled}>
                <Trash2 className="size-4" /> Remove {label.toLowerCase()}
              </Button>
            </div>
          )}
        </div>
        {opening.movable && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Wall:</span>
            {WALLS.map((side) => {
              const on = opening.wall === toOwnWall(side, room.rotation);
              return (
                <Button
                  key={side}
                  size="xs"
                  variant={on ? "secondary" : "outline"}
                  aria-pressed={on}
                  onClick={() => onOpeningSide(side)}
                  disabled={disabled || room.openWalls.includes(toOwnWall(side, room.rotation))}
                >
                  {SIDE_LABELS[side]}
                </Button>
              );
            })}
          </div>
        )}
        {opening.movable && opening.type === "window" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Window type:</span>
            <Button
              size="xs"
              variant={opening.fullHeight ? "outline" : "secondary"}
              aria-pressed={!opening.fullHeight}
              onClick={() => onWindowFullHeight(false)}
              disabled={disabled}
            >
              Standard (with sill)
            </Button>
            <Button
              size="xs"
              variant={opening.fullHeight ? "secondary" : "outline"}
              aria-pressed={opening.fullHeight}
              onClick={() => onWindowFullHeight(true)}
              disabled={disabled}
            >
              Full height (floor to ceiling)
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (item) {
    const isCounter = item.type === "counter_l" || item.type === "counter_straight";
    return (
      <div className={`${PANEL} bg-muted/30`}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{FURNITURE_LABELS[item.type]}</span>
            <span className="text-xs text-muted-foreground">in {room.name} — drag to move, drag the corner dot to resize</span>
          </div>
          <DimensionInput label="Width (ft)" value={item.w} onCommit={(v) => onItemSize("w", v)} disabled={disabled} />
          <DimensionInput label="Depth (ft)" value={item.h} onCommit={(v) => onItemSize("h", v)} disabled={disabled} />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {isCounter && (
              <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
                <Button
                  size="xs"
                  variant={item.type === "counter_l" ? "secondary" : "ghost"}
                  onClick={() => onCounterShape("counter_l")}
                  disabled={disabled}
                >
                  L-shape
                </Button>
                <Button
                  size="xs"
                  variant={item.type === "counter_straight" ? "secondary" : "ghost"}
                  onClick={() => onCounterShape("counter_straight")}
                  disabled={disabled}
                >
                  Straight
                </Button>
              </div>
            )}
            <Button size="sm" variant="outline" onClick={onRotate} disabled={disabled}>
              <RotateCw className="size-4" /> Rotate
            </Button>
            <Button size="sm" variant="outline" onClick={onDeleteItem} disabled={disabled}>
              <Trash2 className="size-4" /> Remove
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const unit = room.unitSystem === "metric" ? "m" : "ft";
  return (
    <div className={`${PANEL} bg-muted/30`}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium">{room.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatFeetInches(room.lengthFt)} x {formatFeetInches(room.widthFt)} — drag to move, corner dot to resize
          </span>
        </div>
        <DimensionInput label={`Length (${unit})`} value={room.length} onCommit={(v) => onResize(room.id, "length", v)} disabled={disabled} />
        <DimensionInput label={`Width (${unit})`} value={room.width} onCommit={(v) => onResize(room.id, "width", v)} disabled={disabled} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onAddOpening("door")} disabled={disabled}>
            <DoorOpen className="size-4" /> Door
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAddOpening("window")} disabled={disabled}>
            <AppWindow className="size-4" /> Window
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAddOpening("window", true)} disabled={disabled}>
            <PanelTop className="size-4" /> Full-height window
          </Button>
          <Button size="sm" variant="outline" onClick={onRotate} disabled={disabled}>
            <RotateCw className="size-4" /> Rotate room
          </Button>
          <Button size="sm" variant="outline" onClick={onRemoveRoom} disabled={disabled}>
            <Trash2 className="size-4" /> Remove
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Open sides (no wall):</span>
        {WALLS.map((side) => {
          const open = room.openWalls.includes(toOwnWall(side, room.rotation));
          return (
            <Button
              key={side}
              size="xs"
              variant={open ? "secondary" : "outline"}
              aria-pressed={open}
              onClick={() => onToggleOpenSide(side)}
              disabled={disabled}
            >
              {SIDE_LABELS[side]}
              {open ? " · open" : ""}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function DimensionInput({
  label,
  value,
  onCommit,
  disabled,
  allowZero = false,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  disabled: boolean;
  allowZero?: boolean;
}) {
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <Input
        type="number"
        inputMode="decimal"
        min={allowZero ? 0 : 0.1}
        step={0.25}
        className="h-8 w-20"
        value={editing ? text : String(Math.round(value * 100) / 100)}
        onFocus={() => {
          setText(String(Math.round(value * 100) / 100));
          setEditing(true);
        }}
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value !== "" && Number.isFinite(n) && (allowZero ? n >= 0 : n > 0) && n <= (allowZero ? 50 : 200)) onCommit(n);
        }}
        onBlur={() => setEditing(false)}
      />
    </label>
  );
}
