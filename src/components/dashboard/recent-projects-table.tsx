import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/calculations/shared";
import type { RecentProject } from "@/lib/data/dashboard";

export function RecentProjectsTable({ projects }: { projects: RecentProject[] }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-sm text-muted-foreground">No projects yet.</p>
        <Link href="/projects" className="text-sm font-medium text-primary hover:underline">
          Create your first project
        </Link>
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
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Carpet Area</TableHead>
            <TableHead className="text-right">Estimated Budget</TableHead>
            <TableHead className="text-right">Quoted Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.clientName}</TableCell>
              <TableCell className="text-muted-foreground">{p.location ?? "—"}</TableCell>
              <TableCell className="text-right">
                {p.carpetArea != null ? `${p.carpetArea.toLocaleString("en-IN")} sqft` : "—"}
              </TableCell>
              <TableCell className="text-right">{formatINR(p.estimatedBudget)}</TableCell>
              <TableCell className="text-right">{formatINR(p.quotedAmount)}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {p.status.replace(/_/g, " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(p.updatedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
