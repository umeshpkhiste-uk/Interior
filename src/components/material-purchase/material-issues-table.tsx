"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MaterialIssueFormDialog } from "./material-issue-form-dialog";
import { formatINR } from "@/lib/calculations/shared";
import type { MaterialIssueListItem } from "@/lib/data/material-issues";
import type { ProjectOption } from "@/lib/data/projects";
import type { PurchaseOrderOption } from "@/lib/data/purchase-orders";

export function MaterialIssuesTable({
  issues,
  projectOptions,
  purchaseOrderOptions,
}: {
  issues: MaterialIssueListItem[];
  projectOptions: ProjectOption[];
  purchaseOrderOptions: PurchaseOrderOption[];
}) {
  const [editing, setEditing] = useState<MaterialIssueListItem | null>(null);

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No material issued yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead>Issued To</TableHead>
            <TableHead>From PO</TableHead>
            <TableHead className="text-right">Left on PO</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue.id} className="cursor-pointer" onClick={() => setEditing(issue)}>
              <TableCell className="font-medium">
                {new Date(`${issue.issue_date}T00:00:00`).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </TableCell>
              <TableCell>{issue.projectCode}</TableCell>
              <TableCell className="text-muted-foreground">
                {issue.item} ({issue.unit}) × {issue.qty}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{issue.qty}</TableCell>
              <TableCell className="text-muted-foreground">{issue.issued_to ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{issue.poNumber ?? "—"}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {issue.leftOnPO != null
                  ? issue.leftOnPO < 0
                    ? `Over by ${-issue.leftOnPO}`
                    : issue.leftOnPO
                  : "—"}
              </TableCell>
              <TableCell className="text-right font-medium">{formatINR(issue.value)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing && (
        <MaterialIssueFormDialog
          projectOptions={projectOptions}
          purchaseOrderOptions={purchaseOrderOptions}
          issue={editing}
          trigger={null}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}
