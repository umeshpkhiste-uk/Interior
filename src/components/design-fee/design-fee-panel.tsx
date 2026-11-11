import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/calculations/shared";
import { DesignFeeForm } from "./design-fee-form";
import { DesignFeeStages } from "./design-fee-stages";
import type { DesignFeeWithStages } from "@/lib/data/design-fee";

export function DesignFeePanel({ projectId, designFee }: { projectId: string; designFee: DesignFeeWithStages | null }) {
  return (
    <div className="flex flex-col gap-4">
      {designFee && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Design fee" value={formatINR(Number(designFee.design_fee_amount))} />
          <Stat label="Extra visits" value={formatINR(Number(designFee.extra_visit_amount))} />
          <Stat label="Before GST" value={formatINR(Number(designFee.total_before_gst))} />
          <Stat label="With GST" value={formatINR(Number(designFee.total_with_gst))} highlight />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Design fee</CardTitle>
        </CardHeader>
        <CardContent>
          <DesignFeeForm projectId={projectId} designFee={designFee} />
        </CardContent>
      </Card>

      {designFee && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Billing milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <DesignFeeStages designFeeId={designFee.id} projectId={projectId} stages={designFee.stages} />
          </CardContent>
        </Card>
      )}
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
