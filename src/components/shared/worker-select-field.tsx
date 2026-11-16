"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/field";
import type { WorkerOption } from "@/lib/data/workers";

export function WorkerSelectField<T extends FieldValues>({
  control,
  name,
  workerOptions,
  error,
}: {
  control: Control<T>;
  name: Path<T>;
  workerOptions: WorkerOption[];
  error?: string;
}) {
  return (
    <Field id={name} label="Worker" error={error} required>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id={name} className="w-full">
              <SelectValue placeholder="Select a worker">
                {(value: string | null) => {
                  const option = workerOptions.find((o) => o.id === value);
                  return option ? `${option.workerCode} — ${option.name}` : "Select a worker";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {workerOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.workerCode} — {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  );
}
