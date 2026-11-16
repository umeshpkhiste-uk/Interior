"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClientApprovalFormDialog } from "./client-approval-form-dialog";
import type { ClientApprovalListItem } from "@/lib/data/client-approvals";
import type { ProjectOption } from "@/lib/data/projects";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  Approved: "default",
  "To chase": "destructive",
  Waiting: "secondary",
};

export function ClientApprovalsTable({
  approvals,
  projectOptions,
}: {
  approvals: ClientApprovalListItem[];
  projectOptions: ProjectOption[];
}) {
  const [editing, setEditing] = useState<ClientApprovalListItem | null>(null);

  if (approvals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No client approvals logged yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Approval For</TableHead>
            <TableHead>Room / Area</TableHead>
            <TableHead>Sent On</TableHead>
            <TableHead>Approved On</TableHead>
            <TableHead>Approved By</TableHead>
            <TableHead className="text-right">Days</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {approvals.map((approval) => (
            <TableRow key={approval.id} className="cursor-pointer" onClick={() => setEditing(approval)}>
              <TableCell className="font-medium">{approval.projectCode}</TableCell>
              <TableCell>{approval.approval_for}</TableCell>
              <TableCell className="text-muted-foreground">{approval.room_area ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(`${approval.sent_on}T00:00:00`).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {approval.approved_on
                  ? new Date(`${approval.approved_on}T00:00:00`).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{approval.approved_by ?? "—"}</TableCell>
              <TableCell className="text-right text-muted-foreground">{approval.days}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[approval.statusLabel] ?? "outline"}>{approval.statusLabel}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing && (
        <ClientApprovalFormDialog
          projectOptions={projectOptions}
          approval={editing}
          trigger={null}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}
