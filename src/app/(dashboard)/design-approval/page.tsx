import { Stamp } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listProjectOptions } from "@/lib/data/projects";
import { listDesignRevisions } from "@/lib/data/design-revisions";
import { listClientApprovals } from "@/lib/data/client-approvals";
import { listSnags } from "@/lib/data/snags";
import { listHandoverChecks } from "@/lib/data/handover-checks";
import { listWarranties } from "@/lib/data/warranties";
import { getDesignApprovalKpis, getDesignApprovalDashboard } from "@/lib/data/design-approval";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleHeader } from "@/components/layout/module-header";
import { DesignApprovalKpiCards } from "@/components/design-approval/design-approval-kpi-cards";
import { DesignRevisionFormDialog } from "@/components/design-approval/design-revision-form-dialog";
import { DesignRevisionsTable } from "@/components/design-approval/design-revisions-table";
import { ClientApprovalFormDialog } from "@/components/design-approval/client-approval-form-dialog";
import { ClientApprovalsTable } from "@/components/design-approval/client-approvals-table";
import { SnagFormDialog } from "@/components/design-approval/snag-form-dialog";
import { SnagsTable } from "@/components/design-approval/snags-table";
import { HandoverCheckFormDialog } from "@/components/design-approval/handover-check-form-dialog";
import { HandoverChecksTable } from "@/components/design-approval/handover-checks-table";
import { WarrantyFormDialog } from "@/components/design-approval/warranty-form-dialog";
import { WarrantiesTable } from "@/components/design-approval/warranties-table";
import { DesignApprovalDashboardPanel } from "@/components/design-approval/design-approval-dashboard-panel";

export default async function DesignApprovalPage() {
  const ctx = await requireCurrentUserContext();
  const orgId = ctx.organizationId;

  const [projectOptions, revisions, approvals, snags, checks, warranties, kpis, dashboard] = await Promise.all([
    listProjectOptions(orgId),
    listDesignRevisions(orgId),
    listClientApprovals(orgId),
    listSnags(orgId),
    listHandoverChecks(orgId),
    listWarranties(orgId),
    getDesignApprovalKpis(orgId),
    getDesignApprovalDashboard(orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <ModuleHeader
        icon={Stamp}
        kitLabel="Add-on 06 • Design Approval & Handover"
        title="Design Approval & Handover Kit"
        subtitle="Every drawing, every client sign-off, every snag, the handover walk and warranties"
        badges={["Revisions", "Approvals", "Snags", "Handover", "Warranty", "Sign-off"]}
      />

      <DesignApprovalKpiCards kpis={kpis} />

      <Tabs defaultValue="revisions">
        <TabsList>
          <TabsTrigger value="revisions">Design Revisions</TabsTrigger>
          <TabsTrigger value="approvals">Client Approvals</TabsTrigger>
          <TabsTrigger value="snags">Snag List</TabsTrigger>
          <TabsTrigger value="handover">Handover Checklist</TabsTrigger>
          <TabsTrigger value="warranty">Warranty Register</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="revisions">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <DesignRevisionFormDialog projectOptions={projectOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <DesignRevisionsTable revisions={revisions} projectOptions={projectOptions} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="approvals">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <ClientApprovalFormDialog projectOptions={projectOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <ClientApprovalsTable approvals={approvals} projectOptions={projectOptions} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="snags">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <SnagFormDialog projectOptions={projectOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <SnagsTable snags={snags} projectOptions={projectOptions} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="handover">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <HandoverCheckFormDialog projectOptions={projectOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <HandoverChecksTable checks={checks} projectOptions={projectOptions} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="warranty">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <WarrantyFormDialog projectOptions={projectOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <WarrantiesTable warranties={warranties} projectOptions={projectOptions} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <DesignApprovalDashboardPanel dashboard={dashboard} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
