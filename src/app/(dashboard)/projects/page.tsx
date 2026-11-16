import { Briefcase } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listClientOptions, listDesignerOptions, listProjects } from "@/lib/data/projects";
import type { ProjectStatus } from "@/lib/data/projects";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectsTable } from "@/components/projects/projects-table";
import { ProjectStatusFilter } from "@/components/projects/project-status-filter";
import { SearchBar } from "@/components/shared/search-bar";
import { ModuleHeader } from "@/components/layout/module-header";
import { MODULE_HEADER_IMAGES } from "@/components/layout/module-header-images";

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
      <ModuleHeader
        icon={Briefcase}
        kitLabel="Core Toolkit • Projects"
        title="Projects"
        subtitle="Track every interior project from enquiry through completion."
        badges={["Enquiry", "Design", "Execution", "Handover"]}
        image={MODULE_HEADER_IMAGES.livingRoom}
      />

      <div className="flex justify-end">
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
