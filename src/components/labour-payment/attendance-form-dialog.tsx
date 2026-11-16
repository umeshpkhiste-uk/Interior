"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AttendanceForm } from "./attendance-form";
import { createLabourAttendance, updateLabourAttendance } from "@/lib/actions/labour-attendance";
import type { LabourAttendanceInput } from "@/lib/validations/labour-attendance";
import type { LabourAttendanceListItem } from "@/lib/data/labour-attendance";
import type { WorkerOption } from "@/lib/data/workers";
import type { ProjectOption } from "@/lib/data/projects";

export function AttendanceFormDialog({
  workerOptions,
  projectOptions,
  entry,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  workerOptions: WorkerOption[];
  projectOptions: ProjectOption[];
  entry?: LabourAttendanceListItem;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(entry);

  const defaultValues: Partial<LabourAttendanceInput> | undefined = entry
    ? {
        workerId: entry.worker_id,
        projectId: entry.project_id ?? "",
        attendanceDate: entry.attendance_date,
        status: entry.status,
        overtimeHours: entry.overtime_hours,
        pieceWork: entry.piece_work ?? "",
        pieces: entry.pieces,
        ratePerPiece: entry.rate_per_piece,
      }
    : undefined;

  async function handleSubmit(values: LabourAttendanceInput) {
    const result = isEdit ? await updateLabourAttendance(entry!.id, values) : await createLabourAttendance(values);
    if (!result.error) {
      setOpen(false);
      router.refresh();
    }
    return { error: result.error };
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger
          render={
            trigger ?? (
              <Button size="sm">
                <Plus className="size-4" />
                Add Entry
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit attendance" : "Add attendance"}</DialogTitle>
        </DialogHeader>
        <AttendanceForm
          workerOptions={workerOptions}
          projectOptions={projectOptions}
          defaultValues={defaultValues}
          submitLabel={isEdit ? "Save changes" : "Add entry"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
