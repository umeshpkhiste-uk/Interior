"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { ProjectSelectField } from "@/components/shared/project-select-field";
import { expenseSchema, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, type ExpenseInput } from "@/lib/validations/expenses";
import type { ProjectOption } from "@/lib/data/projects";

const projectCostFormSchema = expenseSchema.extend({ projectId: z.string().uuid("Select a project") });
export type ProjectCostFormInput = ExpenseInput & { projectId: string };

export function ProjectCostForm({
  projectOptions,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  projectOptions: ProjectOption[];
  defaultValues?: Partial<ProjectCostFormInput>;
  onSubmit: (values: ProjectCostFormInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectCostFormInput>({
    resolver: zodResolver(projectCostFormSchema),
    defaultValues: {
      projectId: "",
      category: "material_purchase",
      description: "",
      amount: 0,
      expenseDate: new Date().toISOString().slice(0, 10),
      ...defaultValues,
    },
  });

  async function submit(values: ProjectCostFormInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <ProjectSelectField control={control} name="projectId" projectOptions={projectOptions} error={errors.projectId?.message} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="category" label="Cost Head" error={errors.category?.message} required>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select cost head">
                    {(value: string | null) => (value ? EXPENSE_CATEGORY_LABELS[value as keyof typeof EXPENSE_CATEGORY_LABELS] : "Select cost head")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {EXPENSE_CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="amount" label="Amount (₹)" error={errors.amount?.message} required>
          <Input id="amount" type="number" min={0} {...register("amount", { valueAsNumber: true })} />
        </Field>
        <Field id="expenseDate" label="Date" error={errors.expenseDate?.message}>
          <Input id="expenseDate" type="date" {...register("expenseDate")} />
        </Field>
      </div>

      <Field id="description" label="Details" error={errors.description?.message}>
        <Input id="description" placeholder="e.g. Hinges and channels, 40 sets — Hardware shop B" {...register("description")} />
      </Field>

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
