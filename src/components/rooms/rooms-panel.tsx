import { Ruler } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoomFormDialog } from "./room-form-dialog";
import { RoomCardActions } from "./room-card-actions";
import { RoomOpenings } from "./room-openings";
import { ROOM_CATEGORY_LABELS } from "@/lib/validations/room";
import type { RoomWithOpenings } from "@/lib/data/rooms";
import { computeProjectAreaTotals } from "@/lib/calculations/area";

export function RoomsPanel({ projectId, rooms }: { projectId: string; rooms: RoomWithOpenings[] }) {
  const totals = computeProjectAreaTotals(
    rooms.map((r) => ({
      floorArea: Number(r.floor_area ?? 0),
      perimeter: 0,
      grossWallArea: Number(r.gross_wall_area ?? 0),
      openingArea: 0,
      netWallArea: Number(r.net_wall_area ?? 0),
      ceilingArea: Number(r.ceiling_area ?? 0),
    }))
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <SummaryStat label="Rooms" value={String(rooms.length)} />
          <SummaryStat label="Total floor area" value={`${totals.totalFloorArea.toFixed(1)} sqft`} />
          <SummaryStat label="Total net wall area" value={`${totals.totalNetWallArea.toFixed(1)} sqft`} />
          <SummaryStat label="Total ceiling area" value={`${totals.totalCeilingArea.toFixed(1)} sqft`} />
        </div>
        <RoomFormDialog projectId={projectId} />
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Ruler className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No rooms yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add every room with its length, width, and height to build the project&apos;s area summary —
              estimators for ceiling, paint, flooring, and electrical all read room areas from here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle>{room.room_name}</CardTitle>
                  <Badge variant="outline" className="mt-1">
                    {ROOM_CATEGORY_LABELS[room.room_category]}
                  </Badge>
                </div>
                <RoomCardActions room={room} projectId={projectId} />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  {room.length} × {room.width} × {room.height} {room.unit_system === "metric" ? "m" : "ft"}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Floor area" value={`${Number(room.floor_area ?? 0).toFixed(1)} sqft`} />
                  <Stat label="Net wall area" value={`${Number(room.net_wall_area ?? 0).toFixed(1)} sqft`} />
                  <Stat label="Gross wall area" value={`${Number(room.gross_wall_area ?? 0).toFixed(1)} sqft`} />
                  <Stat label="Ceiling area" value={`${Number(room.ceiling_area ?? 0).toFixed(1)} sqft`} />
                </div>
                <div className="border-t pt-2">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Openings</p>
                  <RoomOpenings roomId={room.id} projectId={projectId} openings={room.openings} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-lg font-semibold">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-2 py-1.5">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
