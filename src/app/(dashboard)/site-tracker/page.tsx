import { MapPinned } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listProjectOptions } from "@/lib/data/projects";
import { listStageTasks } from "@/lib/data/stage-tasks";
import { listSiteVisits } from "@/lib/data/site-visits";
import {
  getSiteTrackerKpis,
  getSiteTrackerDashboard,
  getProjectProgressOverview,
} from "@/lib/data/site-tracker";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleHeader } from "@/components/layout/module-header";
import { MODULE_HEADER_IMAGES } from "@/components/layout/module-header-images";
import { SiteTrackerKpiCards } from "@/components/site-tracker/site-tracker-kpi-cards";
import { ProjectProgressTable } from "@/components/site-tracker/project-progress-table";
import { StageTaskFormDialog } from "@/components/site-tracker/stage-task-form-dialog";
import { StageTasksTable } from "@/components/site-tracker/stage-tasks-table";
import { SiteVisitFormDialog } from "@/components/site-tracker/site-visit-form-dialog";
import { SiteVisitsTable } from "@/components/site-tracker/site-visits-table";
import { SiteTrackerDashboardPanel } from "@/components/site-tracker/site-tracker-dashboard-panel";

export default async function SiteTrackerPage() {
  const ctx = await requireCurrentUserContext();
  const orgId = ctx.organizationId;

  const [projectOptions, projectProgress, tasks, visits, kpis, dashboard] = await Promise.all([
    listProjectOptions(orgId),
    getProjectProgressOverview(orgId),
    listStageTasks(orgId),
    listSiteVisits(orgId),
    getSiteTrackerKpis(orgId),
    getSiteTrackerDashboard(orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <ModuleHeader
        icon={MapPinned}
        kitLabel="Add-on 01 • Project & Site Tracker"
        title="Project & Site Tracker Kit"
        subtitle="Every project, every stage task and every site visit, in one place"
        badges={["Projects", "Stages", "Tasks", "Site Visits", "Handover", "Progress"]}
        image={MODULE_HEADER_IMAGES.blueprintTools}
      />

      <SiteTrackerKpiCards kpis={kpis} />

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Stage Checklist</TabsTrigger>
          <TabsTrigger value="visits">Site Visits</TabsTrigger>
          <TabsTrigger value="dashboard">Project Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <Card>
            <CardContent className="p-0">
              <ProjectProgressTable projects={projectProgress} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <StageTaskFormDialog projectOptions={projectOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <StageTasksTable tasks={tasks} projectOptions={projectOptions} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visits">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <SiteVisitFormDialog projectOptions={projectOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <SiteVisitsTable visits={visits} projectOptions={projectOptions} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <SiteTrackerDashboardPanel dashboard={dashboard} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
