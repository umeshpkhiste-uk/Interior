import { Truck } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listProjectOptions } from "@/lib/data/projects";
import { listVendorsWithTotals, listVendorOptions } from "@/lib/data/vendors";
import { listPurchaseOrders, listPurchaseOrderOptions } from "@/lib/data/purchase-orders";
import { listMaterialIssues } from "@/lib/data/material-issues";
import { listVendorPayments } from "@/lib/data/vendor-payments";
import { getMaterialPurchaseKpis, getMaterialPurchaseDashboard } from "@/lib/data/material-purchase";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModuleHeader } from "@/components/layout/module-header";
import { MaterialPurchaseKpiCards } from "@/components/material-purchase/material-purchase-kpi-cards";
import { VendorFormDialog } from "@/components/material-purchase/vendor-form-dialog";
import { VendorsTable } from "@/components/material-purchase/vendors-table";
import { PurchaseOrderFormDialog } from "@/components/material-purchase/purchase-order-form-dialog";
import { PurchaseOrdersTable } from "@/components/material-purchase/purchase-orders-table";
import { MaterialIssueFormDialog } from "@/components/material-purchase/material-issue-form-dialog";
import { MaterialIssuesTable } from "@/components/material-purchase/material-issues-table";
import { VendorPaymentFormDialog } from "@/components/material-purchase/vendor-payment-form-dialog";
import { VendorPaymentsTable } from "@/components/material-purchase/vendor-payments-table";
import { MaterialPurchaseDashboardPanel } from "@/components/material-purchase/material-purchase-dashboard-panel";

export default async function MaterialPurchasePage() {
  const ctx = await requireCurrentUserContext();
  const orgId = ctx.organizationId;

  const [
    projectOptions,
    vendors,
    vendorOptions,
    orders,
    purchaseOrderOptions,
    issues,
    payments,
    kpis,
    dashboard,
  ] = await Promise.all([
    listProjectOptions(orgId),
    listVendorsWithTotals(orgId),
    listVendorOptions(orgId),
    listPurchaseOrders(orgId),
    listPurchaseOrderOptions(orgId),
    listMaterialIssues(orgId),
    listVendorPayments(orgId),
    getMaterialPurchaseKpis(orgId),
    getMaterialPurchaseDashboard(orgId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <ModuleHeader
        icon={Truck}
        kitLabel="Add-on 03 • Material Purchase & Vendor"
        title="Material Purchase & Vendor Kit"
        subtitle="Every vendor, every order, every material sent to site and every payment"
        badges={["Vendors", "Purchase Orders", "Delivery", "Site Issue", "Payments", "Balance"]}
      />

      <MaterialPurchaseKpiCards kpis={kpis} />

      <Tabs defaultValue="vendors">
        <TabsList>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="issues">Material Issue</TabsTrigger>
          <TabsTrigger value="payments">Vendor Payments</TabsTrigger>
          <TabsTrigger value="dashboard">Purchase Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <VendorFormDialog />
            </div>
            <Card>
              <CardContent className="p-0">
                <VendorsTable vendors={vendors} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <PurchaseOrderFormDialog vendorOptions={vendorOptions} projectOptions={projectOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <PurchaseOrdersTable orders={orders} vendorOptions={vendorOptions} projectOptions={projectOptions} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <MaterialIssueFormDialog projectOptions={projectOptions} purchaseOrderOptions={purchaseOrderOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <MaterialIssuesTable
                  issues={issues}
                  projectOptions={projectOptions}
                  purchaseOrderOptions={purchaseOrderOptions}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <VendorPaymentFormDialog vendorOptions={vendorOptions} />
            </div>
            <Card>
              <CardContent className="p-0">
                <VendorPaymentsTable payments={payments} vendorOptions={vendorOptions} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <MaterialPurchaseDashboardPanel dashboard={dashboard} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
