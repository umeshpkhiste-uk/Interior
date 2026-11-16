"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { DialogFooter } from "@/components/ui/dialog";
import { ProjectSelectField } from "@/components/shared/project-select-field";
import { invoiceSchema, type InvoiceInput } from "@/lib/validations/invoice";
import type { ProjectOption } from "@/lib/data/projects";

export function InvoiceForm({
  projectOptions,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  projectOptions: ProjectOption[];
  defaultValues?: Partial<InvoiceInput>;
  onSubmit: (values: InvoiceInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      projectId: "",
      invoiceDate: new Date().toISOString().slice(0, 10),
      milestone: "",
      gstPct: 18,
      dueDate: "",
      ...defaultValues,
    },
  });

  async function submit(values: InvoiceInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <ProjectSelectField control={control} name="projectId" projectOptions={projectOptions} error={errors.projectId?.message} />

      <Field id="milestone" label="Milestone" error={errors.milestone?.message} required>
        <Input id="milestone" placeholder="e.g. Booking advance, Design sign-off" {...register("milestone")} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="invoiceDate" label="Invoice date" error={errors.invoiceDate?.message} required>
          <Input id="invoiceDate" type="date" {...register("invoiceDate")} />
        </Field>
        <Field id="dueDate" label="Due date" error={errors.dueDate?.message}>
          <Input id="dueDate" type="date" {...register("dueDate")} />
        </Field>
        <Field id="amount" label="Amount before GST (₹)" error={errors.amount?.message} required>
          <Input id="amount" type="number" min={0} {...register("amount", { valueAsNumber: true })} />
        </Field>
        <Field id="gstPct" label="GST (%)" error={errors.gstPct?.message}>
          <Input id="gstPct" type="number" min={0} max={100} {...register("gstPct", { valueAsNumber: true })} />
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
