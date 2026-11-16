import { Receipt } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listProjectOptions } from "@/lib/data/projects";
import { listInvoices, listInvoiceOptions } from "@/lib/data/invoices";
import { listClientReceipts } from "@/lib/data/client-receipts";
import { listAllProjectCosts } from "@/lib/data/project-costs";
import { listProjectsBilling, getProfitBillingKpis, getProfitBillingDashboard } from "@/lib/data/profit-billing";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleHeader } from "@/components/layout/module-header";
import { ProfitBillingKpiCards } from "@/components/profit-billing/profit-billing-kpi-cards";
import { ProjectsBillingTable } from "@/components/profit-billing/projects-billing-table";
import { InvoiceFormDialog } from "@/components/profit-billing/invoice-form-dialog";
import { InvoicesTable } from "@/components/profit-billing/invoices-table";
import { ReceiptFormDialog } from "@/components/profit-billing/receipt-form-dialog";
import { ReceiptsTable } from "@/components/profit-billing/receipts-table";
import { ProjectCostFormDialog } from "@/components/profit-billing/project-cost-form-dialog";
import { ProjectCostsTable } from "@/components/profit-billing/project-costs-table";
import { ProfitBillingDashboardPanel } from "@/components/profit-billing/profit-billing-dashboard-panel";

export default async function ProjectProfitBillingPage() {
  const ctx = await requireCurrentUserContext();
  const orgId = ctx.organizationId;

  const [projectOptions, projectsBilling, invoices, invoiceOptions, receipts, costs, kpis, dashboard] = await Promise.all([
    listProjectOptions(orgId),
    listProjectsBilling(orgId),
    listInvoices(orgId),
    listInvoiceOptions(orgId),
    listClientReceipts(orgId),
    listAllProjectCosts(orgId),
    getProfitBillingKpis(orgId),
    getProfitBillingDashboard(orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <ModuleHeader
        icon={Receipt}
        kitLabel="Add-on 05 • Project Profit & Billing"
        title="Project Profit & Billing Kit"
        subtitle="Every invoice, every rupee received, every cost and the real profit of each project"
        badges={["Projects", "Invoices", "Receipts", "Costs", "Outstanding", "Profit"]}
      />

      <ProfitBillingKpiCards kpis={kpis} />

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="invoices">Client Invoices</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="costs">Project Costs</TabsTrigger>
          <TabsTrigger value="dashboard">Profit Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <Card>
            <CardContent className="p-0">
              <ProjectsBillingTable projects={projectsBilling} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <InvoiceFormDialog projectOptions={projectOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <InvoicesTable invoices={invoices} projectOptions={projectOptions} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="receipts">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <ReceiptFormDialog projectOptions={projectOptions} invoiceOptions={invoiceOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <ReceiptsTable receipts={receipts} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <ProjectCostFormDialog projectOptions={projectOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <ProjectCostsTable costs={costs} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <ProfitBillingDashboardPanel dashboard={dashboard} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
