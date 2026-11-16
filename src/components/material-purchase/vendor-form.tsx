"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { DialogFooter } from "@/components/ui/dialog";
import { supplierSchema, type SupplierInput } from "@/lib/validations/materials";

export function VendorForm({
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  defaultValues?: Partial<SupplierInput>;
  onSubmit: (values: SupplierInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      category: "",
      contactPhone: "",
      contactEmail: "",
      address: "",
      notes: "",
      ...defaultValues,
    },
  });

  async function submit(values: SupplierInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="name" label="Vendor name" error={errors.name?.message} required>
          <Input id="name" {...register("name")} />
        </Field>
        <Field id="category" label="Category" error={errors.category?.message}>
          <Input id="category" placeholder="e.g. Boards and laminate, Hardware" {...register("category")} />
        </Field>
        <Field id="creditDays" label="Credit days" error={errors.creditDays?.message}>
          <Input id="creditDays" type="number" min={0} {...register("creditDays", { valueAsNumber: true })} />
        </Field>
        <Field id="contactPhone" label="Phone" error={errors.contactPhone?.message}>
          <Input id="contactPhone" {...register("contactPhone")} />
        </Field>
        <Field id="contactEmail" label="Email" error={errors.contactEmail?.message}>
          <Input id="contactEmail" type="email" {...register("contactEmail")} />
        </Field>
      </div>

      <Field id="address" label="Location / address" error={errors.address?.message}>
        <Textarea id="address" rows={2} {...register("address")} />
      </Field>
      <Field id="notes" label="Notes" error={errors.notes?.message}>
        <Textarea id="notes" rows={2} {...register("notes")} />
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
