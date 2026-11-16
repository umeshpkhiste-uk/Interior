"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { materialIssueSchema, type MaterialIssueInput } from "@/lib/validations/material-issue";
import { ProjectSelectField } from "@/components/shared/project-select-field";
import type { ProjectOption } from "@/lib/data/projects";
import type { PurchaseOrderOption } from "@/lib/data/purchase-orders";

export function MaterialIssueForm({
  projectOptions,
  purchaseOrderOptions,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  projectOptions: ProjectOption[];
  purchaseOrderOptions: PurchaseOrderOption[];
  defaultValues?: Partial<MaterialIssueInput>;
  onSubmit: (values: MaterialIssueInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MaterialIssueInput>({
    resolver: zodResolver(materialIssueSchema),
    defaultValues: {
      projectId: "",
      purchaseOrderId: "",
      issueDate: new Date().toISOString().slice(0, 10),
      item: "",
      unit: "",
      issuedTo: "",
      ...defaultValues,
    },
  });

  async function submit(values: MaterialIssueInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <ProjectSelectField control={control} name="projectId" projectOptions={projectOptions} error={errors.projectId?.message} />

      <Field id="purchaseOrderId" label="From PO" error={errors.purchaseOrderId?.message}>
        <Controller
          control={control}
          name="purchaseOrderId"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger id="purchaseOrderId" className="w-full">
                <SelectValue placeholder="Not from a PO">
                  {(value: string | null) => {
                    const option = purchaseOrderOptions.find((o) => o.id === value);
                    return option ? `${option.poNumber} — ${option.item}` : "Not from a PO";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {purchaseOrderOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.poNumber} — {option.item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="item" label="Item" error={errors.item?.message} required>
          <Input id="item" {...register("item")} />
        </Field>
        <Field id="unit" label="Unit" error={errors.unit?.message} required>
          <Input id="unit" {...register("unit")} />
        </Field>
        <Field id="qty" label="Qty" error={errors.qty?.message} required>
          <Input id="qty" type="number" min={0} step="0.01" {...register("qty", { valueAsNumber: true })} />
        </Field>
        <Field id="rate" label="Rate (₹)" error={errors.rate?.message} required>
          <Input id="rate" type="number" min={0} {...register("rate", { valueAsNumber: true })} />
        </Field>
        <Field id="issueDate" label="Date" error={errors.issueDate?.message} required>
          <Input id="issueDate" type="date" {...register("issueDate")} />
        </Field>
        <Field id="issuedTo" label="Issued to" error={errors.issuedTo?.message}>
          <Input id="issuedTo" placeholder="e.g. Carpenter team A, Site supervisor" {...register("issuedTo")} />
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
