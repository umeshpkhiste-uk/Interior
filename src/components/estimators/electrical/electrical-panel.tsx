import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/calculations/shared";
import { ElectricalPoints } from "./electrical-points";
import { ElectricalSettingsForm } from "./electrical-settings-form";
import type { ElectricalPointRow, ElectricalProjectSettingsRow } from "@/lib/data/electrical";
import type { RoomRow } from "@/lib/data/rooms";

export function ElectricalPanel({
  projectId,
  rooms,
  pointsByRoom,
  settings,
}: {
  projectId: string;
  rooms: RoomRow[];
  pointsByRoom: Map<string, ElectricalPointRow[]>;
  settings: ElectricalProjectSettingsRow | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      {settings && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <CostStat label="Material cost" value={formatINR(Number(settings.material_cost))} />
          <CostStat label="Total cost" value={formatINR(Number(settings.total_cost))} />
          <CostStat label="Selling price" value={formatINR(Number(settings.selling_price))} highlight />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Project-wide settings</CardTitle>
        </CardHeader>
        <CardContent>
          <ElectricalSettingsForm projectId={projectId} settings={settings} />
        </CardContent>
      </Card>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">Add rooms first</p>
          </CardContent>
        </Card>
      ) : (
        rooms.map((room) => (
          <Card key={room.id}>
            <CardHeader>
              <CardTitle>{room.room_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <ElectricalPoints roomId={room.id} projectId={projectId} points={pointsByRoom.get(room.id) ?? []} />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function CostStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 ${highlight ? "border-primary bg-primary/5" : ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-lg font-semibold">{value}</p>
    </div>
  );
}
