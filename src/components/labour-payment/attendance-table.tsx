"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AttendanceFormDialog } from "./attendance-form-dialog";
import { formatINR } from "@/lib/calculations/shared";
import { LABOUR_ATTENDANCE_STATUS_LABELS } from "@/lib/validations/labour-attendance";
import type { LabourAttendanceListItem } from "@/lib/data/labour-attendance";
import type { WorkerOption } from "@/lib/data/workers";
import type { ProjectOption } from "@/lib/data/projects";

export function AttendanceTable({
  entries,
  workerOptions,
  projectOptions,
}: {
  entries: LabourAttendanceListItem[];
  workerOptions: WorkerOption[];
  projectOptions: ProjectOption[];
}) {
  const [editing, setEditing] = useState<LabourAttendanceListItem | null>(null);

  if (entries.length === 0) {
    return <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">No attendance marked yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Worker</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Attendance</TableHead>
            <TableHead className="text-right">Overtime</TableHead>
            <TableHead>Piece Work</TableHead>
            <TableHead className="text-right">Day Pay</TableHead>
            <TableHead className="text-right">Piece Pay</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="cursor-pointer" onClick={() => setEditing(entry)}>
              <TableCell className="text-muted-foreground">
                {new Date(`${entry.attendance_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </TableCell>
              <TableCell className="font-medium">
                {entry.workerCode} — {entry.workerName}
              </TableCell>
              <TableCell className="text-muted-foreground">{entry.projectCode ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={entry.status === "absent" ? "secondary" : "default"}>{LABOUR_ATTENDANCE_STATUS_LABELS[entry.status]}</Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{entry.overtime_hours}</TableCell>
              <TableCell className="text-muted-foreground">{entry.piece_work ?? "—"}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(entry.day_pay)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(entry.piece_pay)}</TableCell>
              <TableCell className="text-right font-medium">{formatINR(entry.total_pay)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing && (
        <AttendanceFormDialog
          workerOptions={workerOptions}
          projectOptions={projectOptions}
          entry={editing}
          trigger={null}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}
