"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { LABOUR_TRADES, LABOUR_TRADE_LABELS, workerSchema, type WorkerInput } from "@/lib/validations/worker";

export function WorkerForm({
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  defaultValues?: Partial<WorkerInput>;
  onSubmit: (values: WorkerInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WorkerInput>({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: "",
      trade: "carpenter",
      phone: "",
      team: "",
      ...defaultValues,
    },
  });

  async function submit(values: WorkerInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Field id="name" label="Name" error={errors.name?.message} required>
        <Input id="name" placeholder="e.g. Ramesh K." {...register("name")} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="trade" label="Trade" error={errors.trade?.message} required>
          <Controller
            control={control}
            name="trade"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="trade" className="w-full">
                  <SelectValue placeholder="Select trade">
                    {(value: string | null) => (value ? LABOUR_TRADE_LABELS[value as keyof typeof LABOUR_TRADE_LABELS] : "Select trade")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LABOUR_TRADES.map((trade) => (
                    <SelectItem key={trade} value={trade}>
                      {LABOUR_TRADE_LABELS[trade]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="dailyWage" label="Daily wage (₹)" error={errors.dailyWage?.message} required>
          <Input id="dailyWage" type="number" min={0} {...register("dailyWage", { valueAsNumber: true })} />
        </Field>
        <Field id="phone" label="Phone" error={errors.phone?.message}>
          <Input id="phone" placeholder="e.g. 90000 40001" {...register("phone")} />
        </Field>
        <Field id="team" label="Team" error={errors.team?.message}>
          <Input id="team" placeholder="e.g. Own team, Contractor A" {...register("team")} />
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
