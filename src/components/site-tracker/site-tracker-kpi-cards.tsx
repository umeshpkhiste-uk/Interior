import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/calculations/shared";
import type { SiteTrackerKpis } from "@/lib/data/site-tracker";

export function SiteTrackerKpiCards({ kpis }: { kpis: SiteTrackerKpis }) {
  const cards: { label: string; value: string }[] = [
    { label: "Active Projects", value: String(kpis.activeProjects) },
    { label: "Work in Hand", value: formatINR(kpis.workInHand) },
    { label: "Handover Soon", value: String(kpis.handoverSoon) },
    { label: "Avg Progress", value: kpis.avgProgress != null ? `${Math.round(kpis.avgProgress * 100)}%` : "—" },
    { label: "Tasks Done", value: String(kpis.tasksDone) },
    { label: "Site Visits", value: String(kpis.siteVisits) },
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
