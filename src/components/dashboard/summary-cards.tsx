import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/calculations/shared";
import type { DashboardSummary } from "@/lib/data/dashboard";

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const cards: { label: string; value: string }[] = [
    { label: "Total Projects", value: String(summary.totalProjects) },
    { label: "Active Projects", value: String(summary.activeProjects) },
    { label: "Completed Projects", value: String(summary.completedProjects) },
    { label: "Total Clients", value: String(summary.totalClients) },
    { label: "Total Estimated Project Value", value: formatINR(summary.totalEstimatedValue) },
    { label: "Total Quoted Amount", value: formatINR(summary.totalQuotedAmount) },
    { label: "Total Actual Expenses", value: formatINR(summary.totalActualExpenses) },
    { label: "Expected Profit", value: formatINR(summary.expectedProfit) },
    {
      label: "Avg. Project Cost / Sq Ft",
      value: summary.avgCostPerSqFt != null ? formatINR(summary.avgCostPerSqFt, { decimals: true }) : "—",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold tracking-tight">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
