"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { HandoverCheckFormDialog } from "./handover-check-form-dialog";
import type { HandoverCheckListItem } from "@/lib/data/handover-checks";
import type { ProjectOption } from "@/lib/data/projects";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Done: "default",
  "Needs work": "destructive",
  "Not checked": "outline",
};

export function HandoverChecksTable({
  checks,
  projectOptions,
}: {
  checks: HandoverCheckListItem[];
  projectOptions: ProjectOption[];
}) {
  const [editing, setEditing] = useState<HandoverCheckListItem | null>(null);

  if (checks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No handover checks logged yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Room / Area</TableHead>
            <TableHead>Check</TableHead>
            <TableHead>Checked By</TableHead>
            <TableHead>Checked On</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checks.map((check) => (
            <TableRow key={check.id} className="cursor-pointer" onClick={() => setEditing(check)}>
              <TableCell className="font-medium">{check.projectCode}</TableCell>
              <TableCell className="text-muted-foreground">{check.room_area ?? "—"}</TableCell>
              <TableCell>{check.check_item}</TableCell>
              <TableCell className="text-muted-foreground">{check.checked_by ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {check.checked_on
                  ? new Date(`${check.checked_on}T00:00:00`).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[check.statusLabel] ?? "outline"}>{check.statusLabel}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing && (
        <HandoverCheckFormDialog
          projectOptions={projectOptions}
          check={editing}
          trigger={null}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}
