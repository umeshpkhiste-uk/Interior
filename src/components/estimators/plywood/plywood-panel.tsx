import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/calculations/shared";
import { CutListTable } from "./cut-list-table";
import { PlywoodRatesManager } from "./plywood-rates-manager";
import { PlywoodSettingsForm } from "./plywood-settings-form";
import type { PanelCutRow, PlywoodRateRow, PlywoodProjectSettingsRow } from "@/lib/data/plywood";

export function PlywoodPanel({
  projectId,
  cutList,
  rates,
  settings,
}: {
  projectId: string;
  cutList: PanelCutRow[];
  rates: PlywoodRateRow[];
  settings: PlywoodProjectSettingsRow | null;
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
          <CardTitle className="text-sm font-medium">Cut list</CardTitle>
        </CardHeader>
        <CardContent>
          <CutListTable projectId={projectId} rows={cutList} rates={rates} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Board grade rates (org-wide)</CardTitle>
        </CardHeader>
        <CardContent>
          <PlywoodRatesManager rates={rates} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Laminate, edge-band & pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <PlywoodSettingsForm projectId={projectId} settings={settings} />
        </CardContent>
      </Card>
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
