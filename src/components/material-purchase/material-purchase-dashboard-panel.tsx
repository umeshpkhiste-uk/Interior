import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PurchaseByCategoryChart } from "@/components/charts/purchase-by-category-chart";
import { PurchaseVsPaymentWeekChart } from "@/components/charts/purchase-vs-payment-week-chart";
import { MaterialIssuedByProjectChart } from "@/components/charts/material-issued-by-project-chart";
import { PurchaseHeatmap } from "./purchase-heatmap";
import { formatINR } from "@/lib/calculations/shared";
import { VENDOR_PAYMENT_MODE_LABELS } from "@/lib/validations/vendor-payment";
import type { MaterialPurchaseDashboard } from "@/lib/data/material-purchase";

export function MaterialPurchaseDashboardPanel({ dashboard }: { dashboard: MaterialPurchaseDashboard }) {
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
            <CardTitle className="text-sm font-medium">Purchases by category</CardTitle>
          </CardHeader>
          <CardContent>
            <PurchaseByCategoryChart data={dashboard.purchasesByCategory} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Purchases vs payments by week</CardTitle>
          </CardHeader>
          <CardContent>
            <PurchaseVsPaymentWeekChart data={dashboard.purchasesVsPaymentsByWeek} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ordered vs issued by project</CardTitle>
          </CardHeader>
          <CardContent>
            <MaterialIssuedByProjectChart data={dashboard.byProject} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Payments by mode</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {dashboard.paymentsByMode.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.paymentsByMode.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium">
                        {VENDOR_PAYMENT_MODE_LABELS[row.label as keyof typeof VENDOR_PAYMENT_MODE_LABELS] ?? row.label}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatINR(row.paid)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Purchase heatmap (category x project)</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseHeatmap heatmap={dashboard.heatmap} />
        </CardContent>
      </Card>
    </div>
  );
}
