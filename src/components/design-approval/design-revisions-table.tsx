"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DesignRevisionFormDialog } from "./design-revision-form-dialog";
import type { DesignRevisionListItem } from "@/lib/data/design-revisions";
import type { ProjectOption } from "@/lib/data/projects";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Approved: "default",
  "Changes requested": "destructive",
  "To chase": "destructive",
  Waiting: "secondary",
  "Newer version sent": "outline",
};

export function DesignRevisionsTable({
  revisions,
  projectOptions,
}: {
  revisions: DesignRevisionListItem[];
  projectOptions: ProjectOption[];
}) {
  const [editing, setEditing] = useState<DesignRevisionListItem | null>(null);

  if (revisions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No design revisions logged yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Revision ID</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Room / Area</TableHead>
            <TableHead>Drawing</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Client Asked For</TableHead>
            <TableHead>Sent On</TableHead>
            <TableHead className="text-right">Days</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {revisions.map((revision) => (
            <TableRow key={revision.id} className="cursor-pointer" onClick={() => setEditing(revision)}>
              <TableCell className="font-medium">{revision.revision_code}</TableCell>
              <TableCell>{revision.projectCode}</TableCell>
              <TableCell className="text-muted-foreground">{revision.room_area ?? "—"}</TableCell>
              <TableCell>{revision.drawing}</TableCell>
              <TableCell className="text-muted-foreground">{revision.version}</TableCell>
              <TableCell className="text-muted-foreground">{revision.client_asked_for ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(`${revision.sent_on}T00:00:00`).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{revision.days}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[revision.statusLabel] ?? "outline"}>{revision.statusLabel}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing && (
        <DesignRevisionFormDialog
          projectOptions={projectOptions}
          revision={editing}
          trigger={null}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}
