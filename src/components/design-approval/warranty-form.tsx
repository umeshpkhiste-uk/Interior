"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { DialogFooter } from "@/components/ui/dialog";
import { warrantySchema, type WarrantyInput } from "@/lib/validations/warranty";
import { ProjectSelectField } from "@/components/shared/project-select-field";
import type { ProjectOption } from "@/lib/data/projects";

export function WarrantyForm({
  projectOptions,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  projectOptions: ProjectOption[];
  defaultValues?: Partial<WarrantyInput>;
  onSubmit: (values: WarrantyInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WarrantyInput>({
    resolver: zodResolver(warrantySchema),
    defaultValues: {
      projectId: "",
      item: "",
      handoverDate: new Date().toISOString().slice(0, 10),
      ...defaultValues,
    },
  });

  async function submit(values: WarrantyInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <ProjectSelectField control={control} name="projectId" projectOptions={projectOptions} error={errors.projectId?.message} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="item" label="Item" error={errors.item?.message} required>
          <Input id="item" placeholder="e.g. Modular kitchen, Wardrobes" {...register("item")} />
        </Field>
        <Field id="handoverDate" label="Handover date" error={errors.handoverDate?.message} required>
          <Input id="handoverDate" type="date" {...register("handoverDate")} />
        </Field>
        <Field id="warrantyYears" label="Warranty (years)" error={errors.warrantyYears?.message} required>
          <Input
            id="warrantyYears"
            type="number"
            min={0.5}
            step="0.5"
            {...register("warrantyYears", { valueAsNumber: true })}
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
