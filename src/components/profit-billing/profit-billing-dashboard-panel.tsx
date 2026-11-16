import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BilledVsCostsMonthChart } from "@/components/charts/billed-vs-costs-month-chart";
import { ProfitByProjectChart } from "@/components/charts/profit-by-project-chart";
import { formatINR } from "@/lib/calculations/shared";
import type { ProfitBillingDashboard } from "@/lib/data/profit-billing";

export function ProfitBillingDashboardPanel({ dashboard }: { dashboard: ProfitBillingDashboard }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {dashboard.insights.map((insight) => (
              <li key={insight}>💡 {insight}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Billed vs costs by month</CardTitle>
          </CardHeader>
          <CardContent>
            <BilledVsCostsMonthChart data={dashboard.billedVsCostsByMonth} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Profit by project</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfitByProjectChart data={dashboard.profitByProject} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Costs by head</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dashboard.costsByHead.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No costs logged yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cost head</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.costsByHead.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatINR(row.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
