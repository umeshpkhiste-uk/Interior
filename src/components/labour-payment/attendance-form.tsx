"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import {
  LABOUR_ATTENDANCE_STATUSES,
  LABOUR_ATTENDANCE_STATUS_LABELS,
  labourAttendanceSchema,
  type LabourAttendanceInput,
} from "@/lib/validations/labour-attendance";
import { WorkerSelectField } from "@/components/shared/worker-select-field";
import { ProjectSelectField } from "@/components/shared/project-select-field";
import type { WorkerOption } from "@/lib/data/workers";
import type { ProjectOption } from "@/lib/data/projects";

export function AttendanceForm({
  workerOptions,
  projectOptions,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  workerOptions: WorkerOption[];
  projectOptions: ProjectOption[];
  defaultValues?: Partial<LabourAttendanceInput>;
  onSubmit: (values: LabourAttendanceInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LabourAttendanceInput>({
    resolver: zodResolver(labourAttendanceSchema),
    defaultValues: {
      workerId: "",
      projectId: "",
      attendanceDate: new Date().toISOString().slice(0, 10),
      status: "full_day",
      overtimeHours: 0,
      pieceWork: "",
      pieces: null,
      ratePerPiece: null,
      ...defaultValues,
    },
  });

  const status = watch("status");
  const showPieceWork = status === "piece_work_only";

  async function submit(values: LabourAttendanceInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <WorkerSelectField control={control} name="workerId" workerOptions={workerOptions} error={errors.workerId?.message} />
      <ProjectSelectField control={control} name="projectId" projectOptions={projectOptions} error={errors.projectId?.message} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="attendanceDate" label="Date" error={errors.attendanceDate?.message} required>
          <Input id="attendanceDate" type="date" {...register("attendanceDate")} />
        </Field>
        <Field id="status" label="Attendance" error={errors.status?.message} required>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select attendance">
                    {(value: string | null) =>
                      value ? LABOUR_ATTENDANCE_STATUS_LABELS[value as keyof typeof LABOUR_ATTENDANCE_STATUS_LABELS] : "Select attendance"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LABOUR_ATTENDANCE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {LABOUR_ATTENDANCE_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="overtimeHours" label="Overtime hrs" error={errors.overtimeHours?.message}>
          <Input id="overtimeHours" type="number" min={0} step="0.5" {...register("overtimeHours", { valueAsNumber: true })} />
        </Field>
      </div>

      {showPieceWork && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field id="pieceWork" label="Piece work" error={errors.pieceWork?.message}>
            <Input id="pieceWork" placeholder="e.g. Wardrobe shutters fixed" {...register("pieceWork")} />
          </Field>
          <Field id="pieces" label="Pieces" error={errors.pieces?.message}>
            <Input id="pieces" type="number" min={0} step="0.01" {...register("pieces", { valueAsNumber: true })} />
          </Field>
          <Field id="ratePerPiece" label="Rate / piece (₹)" error={errors.ratePerPiece?.message}>
            <Input id="ratePerPiece" type="number" min={0} {...register("ratePerPiece", { valueAsNumber: true })} />
          </Field>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
