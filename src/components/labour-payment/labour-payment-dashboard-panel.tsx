import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LabourEarnedPaidWeekChart } from "@/components/charts/labour-earned-paid-week-chart";
import { LabourByProjectChart } from "@/components/charts/labour-by-project-chart";
import { AttendanceCalendar } from "./attendance-calendar";
import { formatINR } from "@/lib/calculations/shared";
import type { LabourPaymentDashboard } from "@/lib/data/labour-payment";

export function LabourPaymentDashboardPanel({ dashboard }: { dashboard: LabourPaymentDashboard }) {
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
            <CardTitle className="text-sm font-medium">Labour earned vs paid by week</CardTitle>
          </CardHeader>
          <CardContent>
            <LabourEarnedPaidWeekChart data={dashboard.earnedByWeek} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Labour by project</CardTitle>
          </CardHeader>
          <CardContent>
            <LabourByProjectChart data={dashboard.byProject} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">By trade</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {dashboard.byTrade.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No workers added yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trade</TableHead>
                  <TableHead className="text-right">Workers</TableHead>
                  <TableHead className="text-right">This Week</TableHead>
                  <TableHead className="text-right">Last Week</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.byTrade.map((row) => (
                  <TableRow key={row.trade}>
                    <TableCell className="font-medium">{row.trade}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.workers}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatINR(row.thisWeek)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatINR(row.lastWeek)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Attendance calendar (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceCalendar calendar={dashboard.attendanceCalendar} />
        </CardContent>
      </Card>
    </div>
  );
}
