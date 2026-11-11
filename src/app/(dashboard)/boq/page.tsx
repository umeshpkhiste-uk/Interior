import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listProjects } from "@/lib/data/projects";
import { Card, CardContent } from "@/components/ui/card";

export default async function BoqPage() {
  const ctx = await requireCurrentUserContext();
  const projects = await listProjects(ctx.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">BOQ Management</h1>
        <p className="text-sm text-muted-foreground">
          The Full Home Bill of Quantities lives inside each project, synced from every estimator module.
          Pick a project to open it.
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <ClipboardList className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No projects yet</p>
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
