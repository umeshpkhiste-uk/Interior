import { UserPlus } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listLeads, listLeadOptions, getLeadKpis, getLeadDashboard } from "@/lib/data/leads";
import { listLeadFollowups } from "@/lib/data/lead-followups";
import { listLeadQuotations } from "@/lib/data/lead-quotations";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleHeader } from "@/components/layout/module-header";
import { LeadKpiCards } from "@/components/leads/lead-kpi-cards";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { LeadsTable } from "@/components/leads/leads-table";
import { FollowupFormDialog } from "@/components/leads/followup-form-dialog";
import { FollowupsTable } from "@/components/leads/followups-table";
import { QuotationFormDialog } from "@/components/leads/quotation-form-dialog";
import { QuotationsTable } from "@/components/leads/quotations-table";
import { LeadDashboardPanel } from "@/components/leads/lead-dashboard-panel";

export default async function LeadsPage() {
  const ctx = await requireCurrentUserContext();
  const orgId = ctx.organizationId;

  const [leads, leadOptions, kpis, followups, quotations, dashboard] = await Promise.all([
    listLeads(orgId),
    listLeadOptions(orgId),
    getLeadKpis(orgId),
    listLeadFollowups(orgId),
    listLeadQuotations(orgId),
    getLeadDashboard(orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <ModuleHeader
        icon={UserPlus}
        kitLabel="Add-on 02 • Client Lead CRM"
        title="Client Lead CRM Kit"
        subtitle="Every enquiry, every follow-up and every quotation, from first call to won project"
        badges={["Leads", "Sources", "Follow-ups", "Quotations", "Won", "Pipeline"]}
      />

      <LeadKpiCards kpis={kpis} />

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="followups">Follow-ups</TabsTrigger>
          <TabsTrigger value="quotations">Quotations Sent</TabsTrigger>
          <TabsTrigger value="dashboard">Lead Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <LeadFormDialog />
            </div>
            <Card>
              <CardContent className="p-0">
                <LeadsTable leads={leads} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="followups">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <FollowupFormDialog leadOptions={leadOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <FollowupsTable followups={followups} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quotations">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <QuotationFormDialog leadOptions={leadOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <QuotationsTable quotations={quotations} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <LeadDashboardPanel dashboard={dashboard} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
