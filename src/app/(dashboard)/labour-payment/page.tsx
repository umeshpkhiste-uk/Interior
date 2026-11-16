import { HardHat } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listProjectOptions } from "@/lib/data/projects";
import { listWorkersWithTotals, listWorkerOptions } from "@/lib/data/workers";
import { listLabourAttendance } from "@/lib/data/labour-attendance";
import { listLabourAdvances } from "@/lib/data/labour-advances";
import { listLabourWeeklyPayments } from "@/lib/data/labour-weekly-payments";
import { getLabourPaymentKpis, getLabourPaymentDashboard } from "@/lib/data/labour-payment";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleHeader } from "@/components/layout/module-header";
import { MODULE_HEADER_IMAGES } from "@/components/layout/module-header-images";
import { LabourPaymentKpiCards } from "@/components/labour-payment/labour-payment-kpi-cards";
import { WorkerFormDialog } from "@/components/labour-payment/worker-form-dialog";
import { WorkersTable } from "@/components/labour-payment/workers-table";
import { AttendanceFormDialog } from "@/components/labour-payment/attendance-form-dialog";
import { AttendanceTable } from "@/components/labour-payment/attendance-table";
import { AdvanceFormDialog } from "@/components/labour-payment/advance-form-dialog";
import { AdvancesTable } from "@/components/labour-payment/advances-table";
import { WeeklyPaymentFormDialog } from "@/components/labour-payment/weekly-payment-form-dialog";
import { WeeklyPaymentsTable } from "@/components/labour-payment/weekly-payments-table";
import { LabourPaymentDashboardPanel } from "@/components/labour-payment/labour-payment-dashboard-panel";

export default async function LabourCarpenterPaymentPage() {
  const ctx = await requireCurrentUserContext();
  const orgId = ctx.organizationId;

  const [projectOptions, workers, workerOptions, attendance, advances, payments, kpis, dashboard] = await Promise.all([
    listProjectOptions(orgId),
    listWorkersWithTotals(orgId),
    listWorkerOptions(orgId),
    listLabourAttendance(orgId),
    listLabourAdvances(orgId),
    listLabourWeeklyPayments(orgId),
    getLabourPaymentKpis(orgId),
    getLabourPaymentDashboard(orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <ModuleHeader
        icon={HardHat}
        kitLabel="Add-on 04 • Labour & Carpenter Payment"
        title="Labour & Carpenter Payment Kit"
        subtitle="Every worker, every day on site, every piece of work, advance and weekly pay"
        badges={["Workers", "Attendance", "Piece Work", "Advances", "Weekly Pay", "Balance"]}
        image={MODULE_HEADER_IMAGES.modularKitchen}
      />

      <LabourPaymentKpiCards kpis={kpis} />

      <Tabs defaultValue="workers">
        <TabsList>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="attendance">Attendance & Piece Work</TabsTrigger>
          <TabsTrigger value="advances">Advances</TabsTrigger>
          <TabsTrigger value="payments">Weekly Payment</TabsTrigger>
          <TabsTrigger value="dashboard">Labour Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="workers">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <WorkerFormDialog />
            </div>
            <Card>
              <CardContent className="p-0">
                <WorkersTable workers={workers} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <AttendanceFormDialog workerOptions={workerOptions} projectOptions={projectOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <AttendanceTable entries={attendance} workerOptions={workerOptions} projectOptions={projectOptions} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advances">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <AdvanceFormDialog workerOptions={workerOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <AdvancesTable advances={advances} workerOptions={workerOptions} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <WeeklyPaymentFormDialog workerOptions={workerOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <WeeklyPaymentsTable payments={payments} workerOptions={workerOptions} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <LabourPaymentDashboardPanel dashboard={dashboard} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
