"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectFormDialog } from "./project-form-dialog";
import { ProjectStatusBadge } from "./project-status-badge";
import { duplicateProject, setProjectArchived } from "@/lib/actions/projects";
import type { ClientOption, DesignerOption, ProjectListItem } from "@/lib/data/projects";

export function ProjectsTable({
  projects,
  clients,
  designers,
}: {
  projects: ProjectListItem[];
  clients: ClientOption[];
  designers: DesignerOption[];
}) {
  const router = useRouter();
  const [editingProject, setEditingProject] = useState<ProjectListItem | null>(null);

  async function toggleArchive(project: ProjectListItem) {
    await setProjectArchived(project.id, project.archived_at === null);
    router.refresh();
  }

  async function handleDuplicate(project: ProjectListItem) {
    const result = await duplicateProject(project.id);
    if (!result.error && result.data) {
      router.push(`/projects/${result.data.id}`);
    } else {
      router.refresh();
    }
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No projects found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Carpet Area</TableHead>
            <TableHead>Designer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                <Link href={`/projects/${project.id}`} className="hover:underline">
                  {project.name}
                </Link>
                <p className="text-xs text-muted-foreground">{project.project_code}</p>
              </TableCell>
              <TableCell className="text-muted-foreground">{project.clientName}</TableCell>
              <TableCell className="text-muted-foreground">
                {project.carpet_area != null ? `${project.carpet_area.toLocaleString("en-IN")} sqft` : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {project.assignedDesignerName ?? "Unassigned"}
              </TableCell>
              <TableCell>
                <ProjectStatusBadge status={project.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(project.updated_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label="Actions">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem render={<Link href={`/projects/${project.id}`}>View</Link>} />
                    <DropdownMenuItem onClick={() => setEditingProject(project)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(project)}>
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleArchive(project)}>
                      {project.archived_at ? "Unarchive" : "Archive"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editingProject && (
        <ProjectFormDialog
          project={editingProject}
          clients={clients}
          designers={designers}
          trigger={null}
          open={editingProject !== null}
          onOpenChange={(open) => !open && setEditingProject(null)}
        />
      )}
    </div>
  );
}
