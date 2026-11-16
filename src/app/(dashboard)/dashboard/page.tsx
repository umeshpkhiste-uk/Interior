import { LayoutDashboard } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import {
  getDashboardSummary,
  getMaterialVsLabour,
  getMonthlyFinancials,
  getPackageComparison,
  getProjectCostChart,
  getRecentProjects,
} from "@/lib/data/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleHeader } from "@/components/layout/module-header";
import { MODULE_HEADER_IMAGES } from "@/components/layout/module-header-images";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { RecentProjectsTable } from "@/components/dashboard/recent-projects-table";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ProjectCostChart } from "@/components/charts/project-cost-chart";
import {
  MonthlyRevenueExpensesChart,
  ProfitabilityTrendChart,
} from "@/components/charts/monthly-financials-chart";
import { MaterialVsLabourChart } from "@/components/charts/material-vs-labour-chart";
import { PackageComparisonChart } from "@/components/charts/package-comparison-chart";

export default async function DashboardPage() {
  const ctx = await requireCurrentUserContext();
  const orgId = ctx.organizationId;

  const [summary, projectCosts, monthlyFinancials, materialVsLabour, packageComparison, recentProjects] =
    await Promise.all([
      getDashboardSummary(orgId),
      getProjectCostChart(orgId),
      getMonthlyFinancials(orgId),
      getMaterialVsLabour(orgId),
      getPackageComparison(orgId),
      getRecentProjects(orgId),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <ModuleHeader
        icon={LayoutDashboard}
        kitLabel="Core Toolkit • Dashboard"
        title="Dashboard"
        subtitle={`Welcome back${ctx.fullName ? `, ${ctx.fullName}` : ""} — here's how ${ctx.organizationName} is doing.`}
        badges={["Overview", "Revenue", "Costs", "Profitability"]}
        image={MODULE_HEADER_IMAGES.livingRoom}
      />

      <QuickActions />

      <SummaryCards summary={summary} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Project-wise Estimated Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectCostChart data={projectCosts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Monthly Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyRevenueExpensesChart data={monthlyFinancials} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Profitability Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfitabilityTrendChart data={monthlyFinancials} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Material vs Labour Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <MaterialVsLabourChart data={materialVsLabour} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Basic vs Premium vs Luxury — Average Rate per Sq Ft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PackageComparisonChart data={packageComparison} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentProjectsTable projects={recentProjects} />
        </CardContent>
      </Card>
    </div>
  );
}
