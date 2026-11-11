import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { getProjectById, listClientOptions, listDesignerOptions } from "@/lib/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Badge } from "@/components/ui/badge";

const STUB_TABS = [
  { value: "rooms", label: "Room Measurements", phase: "Phase 6" },
  { value: "estimators", label: "Estimators", phase: "Phase 6" },
  { value: "boq", label: "BOQ", phase: "Phase 7" },
  { value: "quotations", label: "Quotations", phase: "Phase 7" },
  { value: "design-fee", label: "Design Fee", phase: "Phase 7" },
  { value: "packages", label: "Packages", phase: "Phase 7" },
  { value: "expenses", label: "Expenses", phase: "Phase 8" },
  { value: "reports", label: "Reports", phase: "Phase 9" },
];

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireCurrentUserContext();
  const project = await getProjectById(ctx.organizationId, id);
  if (!project) notFound();

  const [clients, designers] = await Promise.all([
    listClientOptions(ctx.organizationId),
    listDesignerOptions(ctx.organizationId),
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
