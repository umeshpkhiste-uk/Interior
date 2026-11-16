import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/calculations/shared";
import type { ProjectBillingListItem } from "@/lib/data/profit-billing";

export function ProjectsBillingTable({ projects }: { projects: ProjectBillingListItem[] }) {
  if (projects.length === 0) {
    return <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">No projects yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="text-right">Contract Value</TableHead>
            <TableHead className="text-right">Billed</TableHead>
            <TableHead className="text-right">Outstanding</TableHead>
            <TableHead className="text-right">Costs</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">Margin</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                {project.projectCode} — {project.name}
              </TableCell>
              <TableCell className="text-muted-foreground">{project.clientName}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(project.contractValue)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(project.billed)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(project.outstanding)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(project.costs)}</TableCell>
              <TableCell className="text-right font-medium">{formatINR(project.profit)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{project.margin !== null ? `${(project.margin * 100).toFixed(1)}%` : "—"}</TableCell>
              <TableCell>
                <Badge variant={project.statusLabel === "Outstanding" ? "secondary" : "default"}>{project.statusLabel}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
