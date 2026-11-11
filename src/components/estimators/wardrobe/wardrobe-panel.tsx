import { DoorClosed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/calculations/shared";
import { totalWardrobePrice } from "@/lib/calculations/wardrobe";
import { WardrobeFormDialog } from "./wardrobe-form-dialog";
import { WardrobeCardActions } from "./wardrobe-card-actions";
import { WardrobeComponents } from "./wardrobe-components";
import { SHUTTER_TYPE_LABELS } from "@/lib/validations/wardrobe";
import type { WardrobeWithComponents } from "@/lib/data/wardrobes";
import type { RoomOption } from "@/lib/data/rooms";

export function WardrobePanel({
  projectId,
  wardrobes,
  rooms,
}: {
  projectId: string;
  wardrobes: WardrobeWithComponents[];
  rooms: RoomOption[];
}) {
  const total = totalWardrobePrice(wardrobes.map((w) => Number(w.selling_price)));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-md border px-3 py-2">
          <p className="text-xs text-muted-foreground">Total wardrobes price (sum of rounded prices)</p>
          <p className="font-heading text-lg font-semibold">{formatINR(total)}</p>
        </div>
        <WardrobeFormDialog projectId={projectId} rooms={rooms} />
      </div>

      {wardrobes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <DoorClosed className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No wardrobes yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wardrobes.map((w) => (
            <Card key={w.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle>{w.name}</CardTitle>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant="outline">{SHUTTER_TYPE_LABELS[w.shutter_type]}</Badge>
                    {w.roomName && <Badge variant="outline">{w.roomName}</Badge>}
                    {w.has_loft && <Badge variant="outline">Loft</Badge>}
                  </div>
                </div>
                <WardrobeCardActions wardrobe={w} projectId={projectId} rooms={rooms} />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  {w.width} × {w.height} × {w.depth} ft
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Material cost" value={formatINR(Number(w.material_cost))} />
                  <Stat label="Total cost" value={formatINR(Number(w.total_cost))} />
                  <Stat label="Selling price" value={formatINR(Number(w.selling_price))} />
                </div>
                <div className="border-t pt-2">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Internal components</p>
                  <WardrobeComponents wardrobeId={w.id} projectId={projectId} components={w.components} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
