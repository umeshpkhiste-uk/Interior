import { Grid2x2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/calculations/shared";
import { FlooringEstimationForm } from "./flooring-estimation-form";
import type { FlooringEstimationRow } from "@/lib/data/flooring";
import type { RoomRow } from "@/lib/data/rooms";

export function FlooringPanel({
  projectId,
  rooms,
  estimationsByRoom,
}: {
  projectId: string;
  rooms: RoomRow[];
  estimationsByRoom: Map<string, FlooringEstimationRow>;
}) {
  if (rooms.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <Grid2x2 className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">Add rooms first</p>
        </CardContent>
      </Card>
    );
  }

  const total = rooms.reduce((sum, r) => sum + Number(estimationsByRoom.get(r.id)?.selling_price ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border px-3 py-2">
        <p className="text-xs text-muted-foreground">Total flooring price (all rooms)</p>
        <p className="font-heading text-lg font-semibold">{formatINR(total)}</p>
      </div>

      {rooms.map((room) => {
        const estimation = estimationsByRoom.get(room.id) ?? null;
        return (
          <Card key={room.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>{room.room_name}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">Floor: {Number(room.floor_area ?? 0).toFixed(1)} sqft</Badge>
                {estimation && <Badge variant="secondary">{formatINR(Number(estimation.selling_price))}</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <FlooringEstimationForm roomId={room.id} projectId={projectId} estimation={estimation} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
