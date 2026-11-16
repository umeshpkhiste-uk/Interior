"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { WorkerSelectField } from "@/components/shared/worker-select-field";
import {
  LABOUR_PAYMENT_MODES,
  LABOUR_PAYMENT_MODE_LABELS,
  labourWeeklyPaymentSchema,
  type LabourWeeklyPaymentInput,
} from "@/lib/validations/labour-weekly-payment";
import type { WorkerOption } from "@/lib/data/workers";

export function WeeklyPaymentForm({
  workerOptions,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  workerOptions: WorkerOption[];
  defaultValues?: Partial<LabourWeeklyPaymentInput>;
  onSubmit: (values: LabourWeeklyPaymentInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LabourWeeklyPaymentInput>({
    resolver: zodResolver(labourWeeklyPaymentSchema),
    defaultValues: {
      workerId: "",
      weekStarting: new Date().toISOString().slice(0, 10),
      advanceRecovered: 0,
      paid: 0,
      mode: "cash",
      ...defaultValues,
    },
  });

  async function submit(values: LabourWeeklyPaymentInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <WorkerSelectField control={control} name="workerId" workerOptions={workerOptions} error={errors.workerId?.message} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="weekStarting" label="Week starting" error={errors.weekStarting?.message} required>
          <Input id="weekStarting" type="date" {...register("weekStarting")} />
        </Field>
        <Field id="advanceRecovered" label="Advance recovered (₹)" error={errors.advanceRecovered?.message}>
          <Input id="advanceRecovered" type="number" min={0} {...register("advanceRecovered", { valueAsNumber: true })} />
        </Field>
        <Field id="paid" label="Paid (₹)" error={errors.paid?.message} required>
          <Input id="paid" type="number" min={0} {...register("paid", { valueAsNumber: true })} />
        </Field>
        <Field id="mode" label="Mode" error={errors.mode?.message} required>
          <Controller
            control={control}
            name="mode"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="mode" className="w-full">
                  <SelectValue placeholder="Select mode">
                    {(value: string | null) => (value ? LABOUR_PAYMENT_MODE_LABELS[value as keyof typeof LABOUR_PAYMENT_MODE_LABELS] : "Select mode")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LABOUR_PAYMENT_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {LABOUR_PAYMENT_MODE_LABELS[mode]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
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
