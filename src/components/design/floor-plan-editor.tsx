"use client";

import { useMemo, useRef, useState, useTransition, type PointerEvent as ReactPointerEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { RotateCw, Save, Undo2, LayoutGrid, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clampItem,
  containsPoint,
  footprint,
  formatFeetInches,
  isPassage,
  labelAnchor,
  localToPlan,
  newFurnitureItem,
  rotationTransform,
  sharedWalls,
  toLocalDelta,
  toOwnWall,
  transferItem,
  wallSegments,
  WALLS,
  type FloorPlanRoom,
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
import { addFloorPlanArea, saveFloorPlanLayout, resetFloorPlanLayout } from "@/lib/actions/floor-plan";
import { deleteRoom } from "@/lib/actions/rooms";
import {
  DimensionLine,
  FLOOR_FILL,
  FurnitureShape,
  HEDGE_FT,
  PassageArea,
  PlanDefs,
  RoomOpenings,
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

type Selection = { kind: "room"; roomId: string } | { kind: "item"; roomId: string; itemId: string } | null;
type Drag = { roomId: string; itemId: string | null; pointerId: number; startX: number; startY: number; originX: number; originY: number };

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
  const [drag, setDrag] = useState<Drag | null>(null);
  const [dirty, setDirty] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const [pending, startTransition] = useTransition();

  const walls = useMemo(() => wallSegments(rooms), [rooms]);
  const sharedWallsByRoom = useMemo(() => new Map(rooms.map((r) => [r.id, sharedWalls(r, rooms)])), [rooms]);
  const selectedRoom = selection ? rooms.find((r) => r.id === selection.roomId) ?? null : null;
  const selectedItem =
    selection?.kind === "item" ? selectedRoom?.furniture.find((f) => f.id === selection.itemId) ?? null : null;

  function commit(next: FloorPlanRoom[], refit = false) {
    setRooms(next);
    if (refit) setFrame(frameFor(next, passage));
    setDirty(true);
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

  function startDrag(e: ReactPointerEvent, roomId: string, itemId: string | null, originX: number, originY: number) {
    e.stopPropagation();
    svgRef.current?.setPointerCapture(e.pointerId);
    svgRef.current?.focus({ preventScroll: true });
    const p = toPlanCoords(e);
    setSelection(itemId ? { kind: "item", roomId, itemId } : { kind: "room", roomId });
    setDrag({ roomId, itemId, pointerId: e.pointerId, startX: p.x, startY: p.y, originX, originY });
  }

  function handlePointerMove(e: ReactPointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const room = rooms.find((r) => r.id === drag.roomId);
    if (!room) return;
    const p = toPlanCoords(e);
    const dx = p.x - drag.startX;
    const dy = p.y - drag.startY;

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
    if (drag.itemId) dropItem(drag.roomId, drag.itemId);
    else setFrame(frameFor(rooms, passage));
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
      patchItem(from.id, item.id, (it) => it);
      return;
    }
    const moved = transferItem(item, from, target);
    commit(
      rooms.map((r) => {
        if (r.id === from.id) return { ...r, furniture: r.furniture.filter((it) => it.id !== item.id) };
        if (r.id === target.id) return { ...r, furniture: [...r.furniture, moved] };
        return r;
      })
    );
    setSelection({ kind: "item", roomId: target.id, itemId: item.id });
  }

  function rotateSelection() {
    if (!selectedRoom) return;
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

  function resizeRoom(roomId: string, field: "length" | "width", value: number) {
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
    setPassage(next);
    setFrame(frameFor(rooms, next));
    setDirty(true);
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
    if (!selectedRoom) return;
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
    setRooms(initialRooms);
    setPassage(initialPassage);
    setFrame(frameFor(initialRooms, initialPassage));
    setDirty(false);
    setResetCount((n) => n + 1);
  }

  /** The current layout, shifted so the plan starts at 0,0 (that's how it's stored). */
  function layoutPayload() {
    const minX = Math.min(...rooms.map((r) => r.x));
    const minY = Math.min(...rooms.map((r) => r.y));
    const initialById = new Map(initialRooms.map((r) => [r.id, r]));
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
            furniture: r.furniture,
            ...(resized ? { size: { length: r.length, width: r.width } } : {}),
          };
        }),
      },
    };
  }

  /** Saves unsaved edits first so adding or removing an area doesn't throw them away. */
  async function saveIfDirty(): Promise<boolean> {
    if (!dirty) return true;
    const result = await saveFloorPlanLayout(projectId, layoutPayload().payload);
    if (result.error) toast.error(result.error);
    return !result.error;
  }

  function save() {
    startTransition(async () => {
      const result = await saveFloorPlanLayout(projectId, layoutPayload().payload);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Floor plan saved — room sizes updated on Room Measurements too");
      router.refresh();
    });
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

  function resetToAuto() {
    if (!window.confirm("Reset every room and its furniture to the automatic arrangement? Saved positions will be cleared.")) return;
    startTransition(async () => {
      const result = await resetFloorPlanLayout(projectId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Layout reset to automatic arrangement");
      router.refresh();
    });
  }

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
        <Button size="sm" variant="ghost" onClick={discardChanges} disabled={!dirty || pending}>
          <Undo2 className="size-4" /> Discard changes
        </Button>
        <Button size="sm" variant="ghost" onClick={resetToAuto} disabled={pending}>
          <LayoutGrid className="size-4" /> Auto-arrange
        </Button>
        <select
          aria-label="Add area"
          className="h-7 rounded-md border bg-background px-2 text-[0.8rem]"
          value=""
          disabled={pending}
          onChange={(e) => {
            if (e.target.value) addArea(e.target.value);
          }}
        >
          <option value="">+ Add area (passage, WC…)</option>
          {PLAN_AREA_PRESETS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
        {dirty && !pending && <span className="text-xs font-medium text-amber-700">Unsaved changes</span>}
      </div>

      <SelectionPanel
        key={`${selection?.roomId ?? "none"}-${resetCount}`}
        room={selectedRoom}
        item={selectedItem}
        disabled={pending}
        onRotate={rotateSelection}
        onResize={resizeRoom}
        onAddFurniture={addFurniture}
        onDeleteItem={deleteSelectedItem}
        onCounterShape={setCounterShape}
        onToggleOpenSide={toggleOpenSide}
        onRemoveRoom={removeSelectedRoom}
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
                  fill={FLOOR_FILL[floorKind(room.category)]}
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
                const itemSelected = selection?.kind === "item" && selection.itemId === item.id;
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

          {rooms.map((room) => (
            <g key={`open-${room.id}`} transform={`translate(${room.x} ${room.y}) ${localTransform(room)}`} pointerEvents="none">
              <RoomOpenings room={room} sharedWalls={sharedWallsByRoom.get(room.id) ?? new Set()} />
            </g>
          ))}

          {rooms.map((room) => {
            const fs = labelSize(room);
            const sizeText = `${formatFeetInches(room.lengthFt)} x ${formatFeetInches(room.widthFt)}`;
            const labelW = Math.max(room.name.length * fs * 0.72, sizeText.length * fs * 0.85 * 0.58);
            const anchor = labelAnchor(room, labelW, fs * 2.4, rooms);
            const cx = anchor.x;
            const cy = anchor.y - fs * 0.35;
            return (
              <g key={`label-${room.id}`} pointerEvents="none" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle">
                <text x={cx} y={cy} fontSize={fs} fontWeight={700} fill="#2b2b2b" stroke="#fbf8f3b3" strokeWidth={fs * 0.2} paintOrder="stroke" letterSpacing={0.02}>
                  {room.name.toUpperCase()}
                </text>
                <text x={cx} y={cy + fs * 1.2} fontSize={fs * 0.85} fontWeight={600} fill="#3a3a3a" stroke="#fbf8f3b3" strokeWidth={fs * 0.2} paintOrder="stroke">
                  {sizeText}
                </text>
              </g>
            );
          })}

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
        </svg>
      </div>
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

const PANEL = "flex min-h-[7rem] flex-col justify-center gap-2 rounded-lg border px-3 py-2";
const SIDE_LABELS: Record<Wall, string> = { top: "Top", right: "Right", bottom: "Bottom", left: "Left" };

function SelectionPanel({
  room,
  item,
  disabled,
  onRotate,
  onResize,
  onAddFurniture,
  onDeleteItem,
  onCounterShape,
  onToggleOpenSide,
  onRemoveRoom,
  passage,
  onPassageChange,
}: {
  room: FloorPlanRoom | null;
  item: FurnitureItem | null;
  disabled: boolean;
  onRotate: () => void;
  onResize: (roomId: string, field: "length" | "width", value: number) => void;
  onAddFurniture: (type: FurnitureType) => void;
  onDeleteItem: () => void;
  onCounterShape: (shape: "counter_l" | "counter_straight") => void;
  onToggleOpenSide: (side: Wall) => void;
  onRemoveRoom: () => void;
  passage: PlanPassage;
  onPassageChange: (side: keyof PlanPassage, feet: number) => void;
}) {
  if (!room) {
    return (
      <div className={`${PANEL} border-dashed text-xs text-muted-foreground`}>
        <p>
          Click a room to move or resize it, or to open its walls. Drag rooms onto each other to join them — the wall between
          them disappears. Click furniture to move, rotate or remove it. Keys: arrows nudge (Shift = 1 ft), R rotates, Delete
          removes furniture. Drag furniture into another room or a passage to move it there. Use “+ Add area” for
          passages, extra WCs, balconies and more.
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

  if (item) {
    const isCounter = item.type === "counter_l" || item.type === "counter_straight";
    return (
      <div className={`${PANEL} bg-muted/30`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{FURNITURE_LABELS[item.type]}</span>
          <span className="text-xs text-muted-foreground">in {room.name} — drag to move</span>
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
            {formatFeetInches(room.lengthFt)} x {formatFeetInches(room.widthFt)} — drag to move
          </span>
        </div>
        <DimensionInput label={`Length (${unit})`} value={room.length} onCommit={(v) => onResize(room.id, "length", v)} disabled={disabled} />
        <DimensionInput label={`Width (${unit})`} value={room.width} onCommit={(v) => onResize(room.id, "width", v)} disabled={disabled} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            aria-label="Add furniture"
            className="h-8 rounded-md border bg-background px-2 text-sm"
            value=""
            disabled={disabled}
            onChange={(e) => {
              if (e.target.value) onAddFurniture(e.target.value as FurnitureType);
            }}
          >
            <option value="">+ Add furniture…</option>
            {FURNITURE_TYPES.map((t) => (
              <option key={t} value={t}>
                {FURNITURE_LABELS[t]}
              </option>
            ))}
          </select>
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
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <Input
        type="number"
        inputMode="decimal"
        min={allowZero ? 0 : 0.1}
        step={0.25}
        className="h-8 w-20"
        value={text}
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value !== "" && Number.isFinite(n) && (allowZero ? n >= 0 : n > 0) && n <= (allowZero ? 50 : 200)) onCommit(n);
        }}
        onBlur={() => setText(String(value))}
      />
    </label>
  );
}
