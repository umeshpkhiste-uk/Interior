"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdvanceFormDialog } from "./advance-form-dialog";
import { formatINR } from "@/lib/calculations/shared";
import type { LabourAdvanceListItem } from "@/lib/data/labour-advances";
import type { WorkerOption } from "@/lib/data/workers";

export function AdvancesTable({ advances, workerOptions }: { advances: LabourAdvanceListItem[]; workerOptions: WorkerOption[] }) {
  const [editing, setEditing] = useState<LabourAdvanceListItem | null>(null);

  if (advances.length === 0) {
    return <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">No advances given yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Worker</TableHead>
            <TableHead className="text-right">Advance</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Still Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {advances.map((advance) => (
            <TableRow key={advance.id} className="cursor-pointer" onClick={() => setEditing(advance)}>
              <TableCell className="text-muted-foreground">
                {new Date(`${advance.advance_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </TableCell>
              <TableCell className="font-medium">
                {advance.workerCode} — {advance.workerName}
              </TableCell>
              <TableCell className="text-right">{formatINR(advance.amount)}</TableCell>
              <TableCell className="text-muted-foreground">{advance.reason ?? "—"}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(advance.stillDue)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing && (
        <AdvanceFormDialog workerOptions={workerOptions} advance={editing} trigger={null} open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} />
      )}
    </div>
  );
}
