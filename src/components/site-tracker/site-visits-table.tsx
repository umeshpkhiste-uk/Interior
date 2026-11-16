"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SiteVisitFormDialog } from "./site-visit-form-dialog";
import type { SiteVisitListItem } from "@/lib/data/site-visits";
import type { ProjectOption } from "@/lib/data/projects";

export function SiteVisitsTable({
  visits,
  projectOptions,
}: {
  visits: SiteVisitListItem[];
  projectOptions: ProjectOption[];
}) {
  const [editing, setEditing] = useState<SiteVisitListItem | null>(null);

  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No site visits logged yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Visit Date</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Visited By</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead className="text-right">Work Done</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Next Visit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits.map((visit) => (
            <TableRow key={visit.id} className="cursor-pointer" onClick={() => setEditing(visit)}>
              <TableCell className="font-medium">
                {new Date(`${visit.visit_date}T00:00:00`).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </TableCell>
              <TableCell>{visit.projectCode}</TableCell>
              <TableCell className="text-muted-foreground">{visit.visited_by ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{visit.purpose ?? "—"}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {visit.work_done_pct != null ? `${Math.round(visit.work_done_pct * 100)}%` : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{visit.notes ?? "—"}</TableCell>
              <TableCell>
                {visit.nextVisitDate ? (
                  <Badge variant={visit.nextVisitOverdue ? "destructive" : "outline"}>
                    {new Date(`${visit.nextVisitDate}T00:00:00`).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </Badge>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing && (
        <SiteVisitFormDialog
          projectOptions={projectOptions}
          visit={editing}
          trigger={null}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}
