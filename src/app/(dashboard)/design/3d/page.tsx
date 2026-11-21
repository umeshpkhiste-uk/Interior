import Link from "next/link";
import { Box, PencilRuler } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listProjects } from "@/lib/data/projects";
import { getFloorPlan } from "@/lib/data/floor-plan";
import { Card, CardContent } from "@/components/ui/card";
import { ModuleHeader } from "@/components/layout/module-header";
import { MODULE_HEADER_IMAGES } from "@/components/layout/module-header-images";
import { FloorPlan3DView } from "@/components/design/floor-plan-3d-view";
import { FloorPlanMissingInputs } from "@/components/design/floor-plan-missing-inputs";

export default async function Design3DPage({
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
        icon={Box}
        kitLabel="Design • 3D View"
        title="3D Design"
        subtitle="A walk-around 3D model of each project, built from its 2D floor plan and room heights."
        badges={["Orbit & zoom", "Doors & windows", "Furniture", "Download image"]}
        image={MODULE_HEADER_IMAGES.livingRoom}
      />

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Box className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No projects yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">Create a project first, then add its rooms.</p>
          </CardContent>
        </Card>
      ) : !activeProject ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Pick a project to see it in 3D.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} href={`/design/3d?project=${p.id}`}>
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
        <Project3D organizationId={ctx.organizationId} projectId={activeProject.id} projectName={activeProject.name} />
      )}
    </div>
  );
}

async function Project3D({
  organizationId,
  projectId,
  projectName,
}: {
  organizationId: string;
  projectId: string;
  projectName: string;
}) {
  const { rooms, missing, passage } = await getFloorPlan(organizationId, projectId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">{projectName}</p>
          {rooms.length > 0 && <p className="text-xs text-muted-foreground">{rooms.length} rooms</p>}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href={`/design/2d?project=${projectId}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <PencilRuler className="size-3.5" /> Edit layout in 2D
          </Link>
          <Link href="/design/3d" className="text-muted-foreground hover:text-foreground">
            Switch project
          </Link>
        </div>
      </div>

      {rooms.length > 0 ? (
        <Card>
          <CardContent className="pt-4">
            <FloorPlan3DView projectId={projectId} projectName={projectName} rooms={rooms} passage={passage} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Box className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Nothing to show in 3D yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add rooms with their length, width and height on this project&apos;s Room Measurements tab.
            </p>
          </CardContent>
        </Card>
      )}

      <FloorPlanMissingInputs missing={missing} />
    </div>
  );
}
