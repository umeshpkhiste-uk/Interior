import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/calculations/shared";
import { computeBoqTotals } from "@/lib/calculations/boq";
import { SyncBoqButton } from "./sync-boq-button";
import { BoqItemFormDialog } from "./boq-item-form-dialog";
import { BoqItemsTable } from "./boq-items-table";
import { BoqSettingsForm } from "./boq-settings-form";
import type { BoqItemWithRoom, BoqSettingsRow } from "@/lib/data/boq";
import type { RoomOption } from "@/lib/data/rooms";

export function BoqPanel({
  projectId,
  items,
  settings,
  rooms,
  carpetArea,
}: {
  projectId: string;
  items: BoqItemWithRoom[];
  settings: BoqSettingsRow | null;
  rooms: RoomOption[];
  carpetArea: number | null;
}) {
  const contingencyPct = Number(settings?.contingency_pct ?? 0.05);
  const gstPct = Number(settings?.gst_pct ?? 0.18);
  const totals = computeBoqTotals(items, contingencyPct, gstPct, carpetArea);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Subtotal" value={formatINR(totals.subtotal)} />
        <Stat label="Contingency" value={formatINR(totals.contingency)} />
        <Stat label="Before GST" value={formatINR(totals.beforeGst)} />
        <Stat label="GST" value={formatINR(totals.gst)} />
        <Stat label="Grand total" value={formatINR(totals.grandTotal)} highlight />
      </div>
      {totals.perSqft !== null && (
        <p className="text-xs text-muted-foreground">Rate per sq.ft (before GST): {formatINR(totals.perSqft, { decimals: true })}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Contingency & GST</CardTitle>
        </CardHeader>
        <CardContent>
          <BoqSettingsForm projectId={projectId} settings={settings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">BOQ items</CardTitle>
          <div className="flex gap-2">
            <SyncBoqButton projectId={projectId} />
            <BoqItemFormDialog projectId={projectId} rooms={rooms} />
          </div>
        </CardHeader>
        <CardContent>
          <BoqItemsTable projectId={projectId} items={items} rooms={rooms} />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 ${highlight ? "border-primary bg-primary/5" : ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-lg font-semibold">{value}</p>
    </div>
  );
}
