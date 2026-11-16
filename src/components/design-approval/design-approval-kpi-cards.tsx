import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DesignApprovalKpis } from "@/lib/data/design-approval";

export function DesignApprovalKpiCards({ kpis }: { kpis: DesignApprovalKpis }) {
  const cards: { label: string; value: string }[] = [
    { label: "Approvals Done", value: String(kpis.approvalsDone) },
    { label: "To Chase", value: String(kpis.toChase) },
    { label: "Revisions", value: String(kpis.revisions) },
    { label: "Open Snags", value: String(kpis.openSnags) },
    {
      label: "Checks Done",
      value: kpis.checksDonePct != null ? `${Math.round(kpis.checksDonePct * 100)}%` : "—",
    },
    { label: "Under Warranty", value: String(kpis.underWarranty) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.label} size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold tracking-tight">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
