import Link from "next/link";
import { Square } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listProjects } from "@/lib/data/projects";
import { getFloorPlan } from "@/lib/data/floor-plan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleHeader } from "@/components/layout/module-header";
import { MODULE_HEADER_IMAGES } from "@/components/layout/module-header-images";
import { FloorPlanEditor } from "@/components/design/floor-plan-editor";
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
        subtitle="A to-scale floor plan generated from each project's Room Measurements — move rooms and furniture, and resize rooms right on the plan."
        badges={["To scale", "Drag & rotate", "Resize rooms", "Furniture"]}
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
  const { rooms, missing, passage } = await getFloorPlan(organizationId, projectId);
  const totalAreaSqft = rooms.reduce((acc, r) => acc + r.lengthFt * r.widthFt, 0);
  // Remount the editor whenever the saved layout or room set changes, so it starts from the server's state.
  const layoutKey = JSON.stringify({ rooms, passage });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">{projectName}</p>
          {rooms.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {totalAreaSqft.toFixed(0)} sqft across {rooms.length} rooms
            </p>
          )}
        </div>
        <Link href="/design/2d" className="text-sm text-muted-foreground hover:text-foreground">
          Switch project
        </Link>
      </div>

      {rooms.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Floor plan</CardTitle>
          </CardHeader>
          <CardContent>
            <FloorPlanEditor key={layoutKey} projectId={projectId} projectName={projectName} initialRooms={rooms} initialPassage={passage} />
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
