"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/field";
import type { ProjectOption } from "@/lib/data/projects";

export function ProjectSelectField<T extends FieldValues>({
  control,
  name,
  projectOptions,
  error,
}: {
  control: Control<T>;
  name: Path<T>;
  projectOptions: ProjectOption[];
  error?: string;
}) {
  return (
    <Field id={name} label="Project" error={error} required>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id={name} className="w-full">
              <SelectValue placeholder="Select a project">
                {(value: string | null) => {
                  const option = projectOptions.find((o) => o.id === value);
                  return option ? `${option.projectCode} — ${option.name}` : "Select a project";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {projectOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.projectCode} — {option.name} ({option.clientName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  );
}
