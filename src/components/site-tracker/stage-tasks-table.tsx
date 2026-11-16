"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StageTaskFormDialog } from "./stage-task-form-dialog";
import type { StageTaskListItem } from "@/lib/data/stage-tasks";
import type { ProjectOption } from "@/lib/data/projects";

function statusVariant(label: string): "default" | "secondary" | "outline" | "destructive" {
  if (label === "Done") return "default";
  if (label.startsWith("Overdue")) return "destructive";
  if (label === "Due today") return "secondary";
  return "outline";
}

export function StageTasksTable({
  tasks,
  projectOptions,
}: {
  tasks: StageTaskListItem[];
  projectOptions: ProjectOption[];
}) {
  const [editing, setEditing] = useState<StageTaskListItem | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No stage tasks logged yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Done By</TableHead>
            <TableHead>Planned Date</TableHead>
            <TableHead>Done On</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} className="cursor-pointer" onClick={() => setEditing(task)}>
              <TableCell className="font-medium">{task.projectCode}</TableCell>
              <TableCell>{task.stage}</TableCell>
              <TableCell className="text-muted-foreground">{task.task}</TableCell>
              <TableCell className="text-muted-foreground">{task.done_by ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {task.planned_date
                  ? new Date(`${task.planned_date}T00:00:00`).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {task.done_on
                  ? new Date(`${task.done_on}T00:00:00`).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(task.statusLabel)}>{task.statusLabel}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing && (
        <StageTaskFormDialog
          projectOptions={projectOptions}
          task={editing}
          trigger={null}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}
