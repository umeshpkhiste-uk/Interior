import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/calculations/shared";
import type { LabourPaymentKpis } from "@/lib/data/labour-payment";

export function LabourPaymentKpiCards({ kpis }: { kpis: LabourPaymentKpis }) {
  const cards: { label: string; value: string }[] = [
    { label: "Workers", value: String(kpis.workers) },
    { label: "On Site Today", value: String(kpis.onSiteToday) },
    { label: "This Week", value: formatINR(kpis.thisWeekEarned) },
    { label: "Last Week", value: formatINR(kpis.lastWeekEarned) },
    { label: "Advance Due", value: formatINR(kpis.advanceDue) },
    { label: "Paid", value: formatINR(kpis.paid) },
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
