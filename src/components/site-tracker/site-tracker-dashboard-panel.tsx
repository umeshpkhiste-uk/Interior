import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectsByStageChart } from "@/components/charts/projects-by-stage-chart";
import { WorkInHandChart } from "@/components/charts/work-in-hand-chart";
import { SiteVisitsByWeekChart } from "@/components/charts/site-visits-by-week-chart";
import type { SiteTrackerDashboard } from "@/lib/data/site-tracker";

export function SiteTrackerDashboardPanel({ dashboard }: { dashboard: SiteTrackerDashboard }) {
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
            <CardTitle className="text-sm font-medium">Projects by stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectsByStageChart data={dashboard.projectsByStage} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Work in hand by project</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkInHandChart data={dashboard.workInHandByProject} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Site visits by week</CardTitle>
          </CardHeader>
          <CardContent>
            <SiteVisitsByWeekChart data={dashboard.siteVisitsByWeek} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Next handovers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {dashboard.nextHandovers.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No handover dates set.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead className="text-right">Days Left</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.nextHandovers.map((handover) => (
                    <TableRow key={handover.id}>
                      <TableCell className="font-medium">{handover.projectCode}</TableCell>
                      <TableCell className="text-muted-foreground">{handover.clientName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(`${handover.expectedCompletionDate}T00:00:00`).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{handover.daysLeft}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
