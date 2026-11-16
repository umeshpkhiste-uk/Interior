"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SnagFormDialog } from "./snag-form-dialog";
import type { SnagListItem } from "@/lib/data/snags";
import type { ProjectOption } from "@/lib/data/projects";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Fixed: "default",
  Overdue: "destructive",
  "Due soon": "secondary",
  Open: "outline",
};

export function SnagsTable({
  snags,
  projectOptions,
}: {
  snags: SnagListItem[];
  projectOptions: ProjectOption[];
}) {
  const [editing, setEditing] = useState<SnagListItem | null>(null);

  if (snags.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No snags logged yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Snag ID</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Room / Area</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Issue</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Fix By</TableHead>
            <TableHead className="text-right">Days to Fix</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {snags.map((snag) => (
            <TableRow key={snag.id} className="cursor-pointer" onClick={() => setEditing(snag)}>
              <TableCell className="font-medium">{snag.snag_code}</TableCell>
              <TableCell>{snag.projectCode}</TableCell>
              <TableCell className="text-muted-foreground">{snag.room_area ?? "—"}</TableCell>
              <TableCell>{snag.item}</TableCell>
              <TableCell className="text-muted-foreground">{snag.issue}</TableCell>
              <TableCell className="text-muted-foreground">{snag.assigned_to ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {snag.fix_by
                  ? new Date(`${snag.fix_by}T00:00:00`).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "—"}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{snag.daysToFix ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[snag.statusLabel] ?? "outline"}>{snag.statusLabel}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing && (
        <SnagFormDialog
          projectOptions={projectOptions}
          snag={editing}
          trigger={null}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}
