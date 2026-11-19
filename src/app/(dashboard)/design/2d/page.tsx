import Link from "next/link";
import { Square } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listProjects } from "@/lib/data/projects";
import { getFloorPlan } from "@/lib/data/floor-plan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleHeader } from "@/components/layout/module-header";
import { MODULE_HEADER_IMAGES } from "@/components/layout/module-header-images";
import { FloorPlan2DSvg } from "@/components/design/floor-plan-2d-svg";
import { FloorPlanMissingInputs } from "@/components/design/floor-plan-missing-inputs";

export default async function Design2DPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectId } = await searchParams;
  const ctx = await requireCurrentUserContext();
  const projects = await listProjects(ctx.organizationId);

  const activeProject = projectId ? projects.find((p) => p.id === projectId) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <ModuleHeader
        icon={Square}
        kitLabel="Design • 2D Floor Plan"
        title="2D Design"
        subtitle="A to-scale floor plan, auto-generated from each project's Room Measurements — nothing new to enter."
        badges={["Rooms", "Auto-arranged", "To scale", "Doors & Windows"]}
        image={MODULE_HEADER_IMAGES.blueprintTools}
      />

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Square className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No projects yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">Create a project first, then add its rooms.</p>
          </CardContent>
        </Card>
      ) : !activeProject ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Pick a project to see its 2D floor plan.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} href={`/design/2d?project=${p.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex flex-col gap-1 py-4">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.project_code} · {p.clientName}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <ProjectFloorPlan organizationId={ctx.organizationId} projectId={activeProject.id} projectName={activeProject.name} />
      )}
    </div>
  );
}

async function ProjectFloorPlan({
  organizationId,
  projectId,
  projectName,
}: {
  organizationId: string;
  projectId: string;
  projectName: string;
}) {
  const { layout, missing } = await getFloorPlan(organizationId, projectId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">{projectName}</p>
          {layout && <p className="text-xs text-muted-foreground">{layout.totalAreaSqft.toFixed(0)} sqft across {layout.rooms.length} rooms</p>}
        </div>
        <Link href="/design/2d" className="text-sm text-muted-foreground hover:text-foreground">
          Switch project
        </Link>
      </div>

      {layout ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Floor plan</CardTitle>
          </CardHeader>
          <CardContent>
            <FloorPlan2DSvg layout={layout} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Square className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No floor plan yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add rooms with their length and width on this project&apos;s Room Measurements tab to generate it.
            </p>
          </CardContent>
        </Card>
      )}

      <FloorPlanMissingInputs missing={missing} />
    </div>
  );
}
