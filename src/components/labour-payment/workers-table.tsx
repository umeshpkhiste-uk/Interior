"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { WorkerFormDialog } from "./worker-form-dialog";
import { formatINR } from "@/lib/calculations/shared";
import { LABOUR_TRADE_LABELS } from "@/lib/validations/worker";
import type { WorkerListItem } from "@/lib/data/workers";

export function WorkersTable({ workers }: { workers: WorkerListItem[] }) {
  const [editing, setEditing] = useState<WorkerListItem | null>(null);

  if (workers.length === 0) {
    return <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">No workers added yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Worker ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Trade</TableHead>
            <TableHead className="text-right">Daily Wage</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-right">Days This Week</TableHead>
            <TableHead className="text-right">Earned This Week</TableHead>
            <TableHead className="text-right">Advance Due</TableHead>
            <TableHead className="text-right">Paid So Far</TableHead>
            <TableHead>Today</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.map((worker) => (
            <TableRow key={worker.id} className="cursor-pointer" onClick={() => setEditing(worker)}>
              <TableCell className="font-medium">{worker.worker_code}</TableCell>
              <TableCell>{worker.name}</TableCell>
              <TableCell className="text-muted-foreground">{LABOUR_TRADE_LABELS[worker.trade]}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(worker.daily_wage)}</TableCell>
              <TableCell className="text-muted-foreground">{worker.team ?? "—"}</TableCell>
              <TableCell className="text-right text-muted-foreground">{worker.daysThisWeek}</TableCell>
              <TableCell className="text-right font-medium">{formatINR(worker.earnedThisWeek)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(worker.advanceDue)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(worker.paidSoFar)}</TableCell>
              <TableCell>
                <Badge variant={worker.today === "Not marked" ? "secondary" : "default"}>{worker.today}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing && <WorkerFormDialog worker={editing} trigger={null} open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} />}
    </div>
  );
}
