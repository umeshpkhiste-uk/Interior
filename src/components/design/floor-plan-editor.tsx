"use client";

import { useMemo, useRef, useState, useTransition, type PointerEvent as ReactPointerEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { RotateCw, Save, Undo2, LayoutGrid, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  footprint,
  formatFeetInches,
  overlappingRoomIds,
  type FloorPlanRoom,
  type PlanRotation,
} from "@/lib/calculations/floor-plan";
import { saveFloorPlanLayout, resetFloorPlanLayout } from "@/lib/actions/floor-plan";
import { RoomFurniture, RoomOpenings, WALL_FT, localTransform } from "./floor-plan-symbols";

const GRID_FT = 0.25;
const EDGE_SNAP_FT = 0.6;
const PAD_FT = 3;

type Drag = { id: string; pointerId: number; startX: number; startY: number; roomX: number; roomY: number };

function frameFor(rooms: FloorPlanRoom[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rooms) {
    const { w, h } = footprint(r);
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + w);
    maxY = Math.max(maxY, r.y + h);
  }
  return { x: minX - PAD_FT, y: minY - PAD_FT, w: maxX - minX + PAD_FT * 2, h: maxY - minY + PAD_FT * 2 };
}

const snapToGrid = (v: number) => Math.round(v / GRID_FT) * GRID_FT;

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

export function FloorPlanEditor({ projectId, initialRooms }: { projectId: string; initialRooms: FloorPlanRoom[] }) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [rooms, setRooms] = useState(initialRooms);
  const [frame, setFrame] = useState(() => frameFor(initialRooms));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();

  const overlapping = useMemo(() => overlappingRoomIds(rooms), [rooms]);
  const selected = rooms.find((r) => r.id === selectedId) ?? null;

  function toPlanCoords(e: ReactPointerEvent) {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  function updateRoom(id: string, patch: Partial<FloorPlanRoom>) {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setDirty(true);
  }

  function handlePointerDown(e: ReactPointerEvent, room: FloorPlanRoom) {
    e.stopPropagation();
    svgRef.current?.setPointerCapture(e.pointerId);
    svgRef.current?.focus({ preventScroll: true });
    const p = toPlanCoords(e);
    setSelectedId(room.id);
    setDrag({ id: room.id, pointerId: e.pointerId, startX: p.x, startY: p.y, roomX: room.x, roomY: room.y });
  }

  function handlePointerMove(e: ReactPointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const room = rooms.find((r) => r.id === drag.id);
    if (!room) return;
    const p = toPlanCoords(e);
    const { w, h } = footprint(room);
    const others = rooms.filter((r) => r.id !== room.id);
    const xEdges = others.flatMap((r) => [r.x, r.x + footprint(r).w]);
    const yEdges = others.flatMap((r) => [r.y, r.y + footprint(r).h]);
    const x = snapToEdges(snapToGrid(drag.roomX + p.x - drag.startX), w, xEdges);
    const y = snapToEdges(snapToGrid(drag.roomY + p.y - drag.startY), h, yEdges);
    if (x !== room.x || y !== room.y) updateRoom(room.id, { x, y });
  }

  function endDrag(e: ReactPointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    setDrag(null);
    setFrame(frameFor(rooms));
  }

  function rotateSelected() {
    if (!selected) return;
    const before = footprint(selected);
    const rotation = ((selected.rotation + 90) % 360) as PlanRotation;
    const after = footprint({ ...selected, rotation });
    const x = snapToGrid(selected.x + (before.w - after.w) / 2);
    const y = snapToGrid(selected.y + (before.h - after.h) / 2);
    const next = rooms.map((r) => (r.id === selected.id ? { ...r, rotation, x, y } : r));
    setRooms(next);
    setFrame(frameFor(next));
    setDirty(true);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!selected) return;
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
      updateRoom(selected.id, { x: selected.x + dx, y: selected.y + dy });
    } else if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      rotateSelected();
    } else if (e.key === "Escape") {
      setSelectedId(null);
    }
  }

  function discardChanges() {
    setRooms(initialRooms);
    setFrame(frameFor(initialRooms));
    setDirty(false);
  }

  function save() {
    const minX = Math.min(...rooms.map((r) => r.x));
    const minY = Math.min(...rooms.map((r) => r.y));
    startTransition(async () => {
      const result = await saveFloorPlanLayout(
        projectId,
        rooms.map((r) => ({ id: r.id, x: r.x - minX, y: r.y - minY, rotation: r.rotation }))
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Floor plan layout saved");
      router.refresh();
    });
  }

  function resetToAuto() {
    if (!window.confirm("Reset every room to the automatic arrangement? Your saved positions will be cleared.")) return;
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
    return Math.max(0.3, Math.min(0.55, Math.min(w, h) * 0.085));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={rotateSelected} disabled={!selected || pending}>
          <RotateCw className="size-4" /> Rotate
        </Button>
        <Button size="sm" onClick={save} disabled={!dirty || pending}>
          <Save className="size-4" /> {pending ? "Saving..." : "Save layout"}
        </Button>
        <Button size="sm" variant="ghost" onClick={discardChanges} disabled={!dirty || pending}>
          <Undo2 className="size-4" /> Discard changes
        </Button>
        <Button size="sm" variant="ghost" onClick={resetToAuto} disabled={pending}>
          <LayoutGrid className="size-4" /> Auto-arrange
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {selected
            ? `${selected.name} selected — drag to move, R to rotate, arrow keys to nudge (Shift = 1 ft)`
            : "Click a room to select it, then drag it into place"}
        </span>
      </div>

      {overlapping.size > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="size-3.5" /> Some rooms overlap (shown in red) — drag them apart.
        </p>
      )}
      {dirty && !pending && <p className="text-xs text-amber-700">Unsaved changes</p>}

      <div className="overflow-hidden rounded-lg border bg-white">
        <svg
          ref={svgRef}
          viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
          className="block h-auto max-h-[78vh] w-full outline-none select-none"
          role="application"
          aria-label="Editable 2D floor plan. Select a room, then drag, rotate with R, or nudge with arrow keys."
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerDown={() => setSelectedId(null)}
        >
          <defs>
            <pattern id="plan-grid" width={1} height={1} patternUnits="userSpaceOnUse">
              <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#eef0f2" strokeWidth={0.03} />
            </pattern>
          </defs>
          <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} fill="url(#plan-grid)" />

          {rooms.map((room) => {
            const { w, h } = footprint(room);
            const fill = overlapping.has(room.id) ? "#fde2e2" : room.id === selectedId ? "#fff7e6" : "#fff";
            return (
              <g
                key={`floor-${room.id}`}
                transform={`translate(${room.x} ${room.y})`}
                onPointerDown={(e) => handlePointerDown(e, room)}
                className={drag?.id === room.id ? "cursor-grabbing" : "cursor-grab"}
                style={{ touchAction: "none" }}
              >
                <rect width={w} height={h} fill={fill} />
                <g transform={localTransform(room)}>
                  <RoomFurniture room={room} />
                </g>
              </g>
            );
          })}

          {rooms.map((room) => {
            const { w, h } = footprint(room);
            return (
              <rect
                key={`wall-${room.id}`}
                x={room.x}
                y={room.y}
                width={w}
                height={h}
                fill="none"
                stroke="#111"
                strokeWidth={WALL_FT}
                pointerEvents="none"
              />
            );
          })}

          {rooms.map((room) => (
            <g key={`open-${room.id}`} transform={`translate(${room.x} ${room.y}) ${localTransform(room)}`} pointerEvents="none">
              <RoomOpenings room={room} />
            </g>
          ))}

          {rooms.map((room) => {
            const { w, h } = footprint(room);
            const fs = labelSize(room);
            const cx = room.x + w / 2;
            const cy = room.y + h / 2;
            return (
              <g key={`label-${room.id}`} pointerEvents="none" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle">
                <text x={cx} y={cy} fontSize={fs} fontWeight={700} fill="#111" stroke="#fff" strokeWidth={fs * 0.3} paintOrder="stroke" letterSpacing={0.02}>
                  {room.name.toUpperCase()}
                </text>
                <text x={cx} y={cy + fs * 1.2} fontSize={fs * 0.85} fontWeight={600} fill="#222" stroke="#fff" strokeWidth={fs * 0.3} paintOrder="stroke">
                  {formatFeetInches(room.lengthFt)} x {formatFeetInches(room.widthFt)}
                </text>
              </g>
            );
          })}

          {selected && (
            <rect
              x={selected.x - WALL_FT}
              y={selected.y - WALL_FT}
              width={footprint(selected).w + WALL_FT * 2}
              height={footprint(selected).h + WALL_FT * 2}
              fill="none"
              stroke="#d97706"
              strokeWidth={0.08}
              strokeDasharray="0.4 0.25"
              pointerEvents="none"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
