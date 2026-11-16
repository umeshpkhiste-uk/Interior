"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { DialogFooter } from "@/components/ui/dialog";
import { WorkerSelectField } from "@/components/shared/worker-select-field";
import { labourAdvanceSchema, type LabourAdvanceInput } from "@/lib/validations/labour-advance";
import type { WorkerOption } from "@/lib/data/workers";

export function AdvanceForm({
  workerOptions,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  workerOptions: WorkerOption[];
  defaultValues?: Partial<LabourAdvanceInput>;
  onSubmit: (values: LabourAdvanceInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LabourAdvanceInput>({
    resolver: zodResolver(labourAdvanceSchema),
    defaultValues: {
      workerId: "",
      advanceDate: new Date().toISOString().slice(0, 10),
      reason: "",
      ...defaultValues,
    },
  });

  async function submit(values: LabourAdvanceInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <WorkerSelectField control={control} name="workerId" workerOptions={workerOptions} error={errors.workerId?.message} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="advanceDate" label="Date" error={errors.advanceDate?.message} required>
          <Input id="advanceDate" type="date" {...register("advanceDate")} />
        </Field>
        <Field id="amount" label="Advance (₹)" error={errors.amount?.message} required>
          <Input id="amount" type="number" min={0} {...register("amount", { valueAsNumber: true })} />
        </Field>
        <Field id="reason" label="Reason" error={errors.reason?.message}>
          <Input id="reason" placeholder="e.g. Family function" {...register("reason")} />
        </Field>
      </div>

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
