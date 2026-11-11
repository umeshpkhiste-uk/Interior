import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { getProjectById, listClientOptions, listDesignerOptions } from "@/lib/data/projects";
import { listRoomsForProject } from "@/lib/data/rooms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Badge } from "@/components/ui/badge";
import { RoomsPanel } from "@/components/rooms/rooms-panel";
import { EstimatorsPanel } from "@/components/estimators/estimators-panel";
import { BoqPanel } from "@/components/boq/boq-panel";
import { QuotationsPanel } from "@/components/quotations/quotations-panel";
import { DesignFeePanel } from "@/components/design-fee/design-fee-panel";
import { PackagesPanel } from "@/components/packages/packages-panel";
import { listBoqItems, getBoqSettings } from "@/lib/data/boq";
import { listQuotations } from "@/lib/data/quotations";
import { getDesignFee } from "@/lib/data/design-fee";
import { listRoomOptions } from "@/lib/data/rooms";
import { ProfitabilityPanel } from "@/components/profitability/profitability-panel";
import { ExpensesPanel } from "@/components/expenses/expenses-panel";
import { listExpenses, listPayments } from "@/lib/data/expenses";

const STUB_TABS = [{ value: "reports", label: "Reports", phase: "Phase 9" }];

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireCurrentUserContext();
  const project = await getProjectById(ctx.organizationId, id);
  if (!project) notFound();

  const [clients, designers, rooms, roomOptions, boqItems, boqSettings, quotations, designFee, expenses, payments] =
    await Promise.all([
      listClientOptions(ctx.organizationId),
      listDesignerOptions(ctx.organizationId),
      listRoomsForProject(ctx.organizationId, id),
      listRoomOptions(ctx.organizationId, id),
      listBoqItems(ctx.organizationId, id),
      getBoqSettings(ctx.organizationId, id),
      listQuotations(ctx.organizationId, id),
      getDesignFee(ctx.organizationId, id),
      listExpenses(ctx.organizationId, id),
      listPayments(ctx.organizationId, id),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href="/projects"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Back to projects
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
            {project.archived_at && <Badge variant="outline">Archived</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {project.project_code} · {project.clientName}
          </p>
        </div>
        <ProjectFormDialog
          project={project}
          clients={clients}
          designers={designers}
          trigger={<button type="button">Edit project</button>}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rooms">Room Measurements</TabsTrigger>
          <TabsTrigger value="estimators">Estimators</TabsTrigger>
          <TabsTrigger value="boq">BOQ</TabsTrigger>
          <TabsTrigger value="quotations">Quotations</TabsTrigger>
          <TabsTrigger value="design-fee">Design Fee</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="cost-profit">Cost &amp; Profit</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          {STUB_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Project details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <DetailRow label="Property address" value={project.property_address} />
              <DetailRow
                label="Property type"
                value={project.property_type?.replace(/_/g, " ") ?? null}
              />
              <DetailRow
                label="Bedrooms / Bathrooms"
                value={
                  project.bedrooms != null || project.bathrooms != null
                    ? `${project.bedrooms ?? "—"} / ${project.bathrooms ?? "—"}`
                    : null
                }
              />
              <DetailRow
                label="Carpet / Built-up area"
                value={
                  project.carpet_area != null || project.built_up_area != null
                    ? `${project.carpet_area ?? "—"} / ${project.built_up_area ?? "—"} sqft`
                    : null
                }
              />
              <DetailRow label="Start date" value={project.start_date} />
              <DetailRow label="Expected completion" value={project.expected_completion_date} />
              {project.description && (
                <div className="col-span-full">
                  <p className="text-muted-foreground">Description</p>
                  <p className="whitespace-pre-wrap">{project.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms">
          <RoomsPanel projectId={id} rooms={rooms} />
        </TabsContent>
        <TabsContent value="estimators">
          <EstimatorsPanel projectId={id} />
        </TabsContent>
        <TabsContent value="boq">
          <BoqPanel
            projectId={id}
            items={boqItems}
            settings={boqSettings}
            rooms={roomOptions}
            carpetArea={project.carpet_area}
          />
        </TabsContent>
        <TabsContent value="quotations">
          <QuotationsPanel projectId={id} quotations={quotations} />
        </TabsContent>
        <TabsContent value="design-fee">
          <DesignFeePanel projectId={id} designFee={designFee} />
        </TabsContent>
        <TabsContent value="packages">
          <PackagesPanel organizationId={ctx.organizationId} projectId={id} carpetArea={project.carpet_area} />
        </TabsContent>
        <TabsContent value="cost-profit">
          <ProfitabilityPanel organizationId={ctx.organizationId} projectId={id} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesPanel projectId={id} expenses={expenses} payments={payments} />
        </TabsContent>

        {STUB_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
                <p className="text-sm font-medium">{tab.label} ships in {tab.phase}</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  This section of the project workspace is built in a later phase, following the
                  project&apos;s phased delivery plan.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value || "—"}</span>
    </div>
  );
}
