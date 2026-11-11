import { requireCurrentUserContext } from "@/lib/data/organization";
import { listClientOptions, listDesignerOptions, listProjects } from "@/lib/data/projects";
import type { ProjectStatus } from "@/lib/data/projects";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectsTable } from "@/components/projects/projects-table";
import { ProjectStatusFilter } from "@/components/projects/project-status-filter";
import { SearchBar } from "@/components/shared/search-bar";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; archived?: string }>;
}) {
  const { q, status, archived } = await searchParams;
  const ctx = await requireCurrentUserContext();

  const [projects, clients, designers] = await Promise.all([
    listProjects(ctx.organizationId, {
      search: q,
      status: (status as ProjectStatus | undefined) ?? "all",
      includeArchived: archived === "1",
    }),
    listClientOptions(ctx.organizationId),
    listDesignerOptions(ctx.organizationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Track every interior project from enquiry through completion.
          </p>
        </div>
        <ProjectFormDialog clients={clients} designers={designers} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchBar placeholder="Search projects..." />
        <ProjectStatusFilter />
      </div>

      <Card>
        <CardContent className="p-0">
          <ProjectsTable projects={projects} clients={clients} designers={designers} />
        </CardContent>
      </Card>
    </div>
  );
}
