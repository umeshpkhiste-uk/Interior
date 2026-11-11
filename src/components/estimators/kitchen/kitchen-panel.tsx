import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/calculations/shared";
import { KitchenSettingsForm } from "./kitchen-settings-form";
import { KitchenAccessories } from "./kitchen-accessories";
import type { KitchenEstimationWithAccessories } from "@/lib/data/kitchen";

export function KitchenPanel({
  projectId,
  estimation,
}: {
  projectId: string;
  estimation: KitchenEstimationWithAccessories | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      {estimation && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          <CostStat label="Material cost" value={formatINR(Number(estimation.material_cost))} />
          <CostStat label="Labour cost" value={formatINR(Number(estimation.labour_cost))} />
          <CostStat label="Total cost" value={formatINR(Number(estimation.total_cost))} />
          <CostStat label="Selling price" value={formatINR(Number(estimation.selling_price))} highlight />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Kitchen details</CardTitle>
        </CardHeader>
        <CardContent>
          <KitchenSettingsForm projectId={projectId} estimation={estimation} />
        </CardContent>
      </Card>

      {estimation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Hardware & accessories</CardTitle>
          </CardHeader>
          <CardContent>
            <KitchenAccessories
              kitchenEstimationId={estimation.id}
              projectId={projectId}
              accessories={estimation.accessories}
            />
          </CardContent>
        </Card>
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
