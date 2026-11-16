import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/calculations/shared";
import type { LeadKpis } from "@/lib/data/leads";

export function LeadKpiCards({ kpis }: { kpis: LeadKpis }) {
  const cards: { label: string; value: string }[] = [
    { label: "Leads", value: String(kpis.totalLeads) },
    { label: "Open Leads", value: String(kpis.openLeads) },
    { label: "Quotes Open", value: formatINR(kpis.openQuotesValue) },
    { label: "Won Value", value: formatINR(kpis.wonValue) },
    {
      label: "Conversion",
      value: kpis.conversionRate != null ? `${Math.round(kpis.conversionRate * 100)}%` : "—",
    },
    { label: "Call Today", value: String(kpis.callToday) },
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
