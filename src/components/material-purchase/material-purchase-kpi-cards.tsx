import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/calculations/shared";
import type { MaterialPurchaseKpis } from "@/lib/data/material-purchase";

export function MaterialPurchaseKpiCards({ kpis }: { kpis: MaterialPurchaseKpis }) {
  const cards: { label: string; value: string }[] = [
    { label: "Purchases", value: formatINR(kpis.purchases) },
    { label: "Paid", value: formatINR(kpis.paid) },
    { label: "Balance to Pay", value: formatINR(kpis.balanceToPay) },
    { label: "Material Issued", value: formatINR(kpis.materialIssued) },
    { label: "Awaiting Delivery", value: String(kpis.awaitingDelivery) },
    { label: "Vendors", value: String(kpis.vendors) },
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
