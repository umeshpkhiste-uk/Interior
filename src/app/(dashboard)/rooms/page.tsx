import Link from "next/link";
import { Ruler } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listProjects } from "@/lib/data/projects";
import { Card, CardContent } from "@/components/ui/card";

export default async function RoomsPage() {
  const ctx = await requireCurrentUserContext();
  const projects = await listProjects(ctx.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Room Measurements</h1>
        <p className="text-sm text-muted-foreground">
          Room measurements are captured per project. Pick a project to add rooms and openings.
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Ruler className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No projects yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create a project first, then open its Room Measurements tab.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
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
      )}
    </div>
  );
}
