import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadSourceChart } from "@/components/charts/lead-source-chart";
import { LeadStageChart } from "@/components/charts/lead-stage-chart";
import { LeadQuotationStatusChart } from "@/components/charts/lead-quotation-status-chart";
import { LeadWeeklyTrendChart } from "@/components/charts/lead-weekly-trend-chart";
import { LeadPipelineBoard } from "./lead-pipeline-board";
import type { LeadDashboard } from "@/lib/data/leads";

export function LeadDashboardPanel({ dashboard }: { dashboard: LeadDashboard }) {
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
            <CardTitle className="text-sm font-medium">Leads by source</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadSourceChart data={dashboard.leadsBySource} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Leads by stage</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadStageChart data={dashboard.leadsByStage} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quotation value by status</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadQuotationStatusChart data={dashboard.quotationsByStatus} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">New leads &amp; follow-ups by week</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadWeeklyTrendChart data={dashboard.weeklyTrend} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Lead pipeline board</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadPipelineBoard pipeline={dashboard.pipeline} />
        </CardContent>
      </Card>
    </div>
  );
}
