import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/calculations/shared";
import type { ProfitBillingKpis } from "@/lib/data/profit-billing";

export function ProfitBillingKpiCards({ kpis }: { kpis: ProfitBillingKpis }) {
  const cards: { label: string; value: string }[] = [
    { label: "Contract Value", value: formatINR(kpis.contractValue) },
    { label: "Billed", value: formatINR(kpis.billed) },
    { label: "Received", value: formatINR(kpis.received) },
    { label: "Outstanding", value: formatINR(kpis.outstanding) },
    { label: "Costs", value: formatINR(kpis.costs) },
    { label: "Profit So Far", value: formatINR(kpis.profitSoFar) },
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
