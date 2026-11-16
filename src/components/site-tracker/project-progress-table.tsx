import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { formatINR } from "@/lib/calculations/shared";
import type { ProjectProgressItem } from "@/lib/data/site-tracker";

export function ProjectProgressTable({ projects }: { projects: ProjectProgressItem[] }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No projects yet.
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
            <TableHead className="text-right">Work in Hand</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Current Stage</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Handover Target</TableHead>
            <TableHead className="text-right">Days Left</TableHead>
            <TableHead className="text-right">Visits</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                <Link href={`/projects/${project.id}`} className="hover:underline">
                  {project.projectCode}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{project.clientName}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(project.workInHand)}</TableCell>
              <TableCell>
                <ProjectStatusBadge status={project.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{project.currentStage ?? "—"}</TableCell>
              <TableCell>
                {project.progress != null ? (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.round(project.progress * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {project.done}/{project.tasks}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">No tasks</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {project.expectedCompletionDate
                  ? new Date(`${project.expectedCompletionDate}T00:00:00`).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{project.daysLeft ?? "—"}</TableCell>
              <TableCell className="text-right text-muted-foreground">{project.visits}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
