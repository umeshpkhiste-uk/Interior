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
import {
  PURCHASE_DELIVERY_STATUSES,
  PURCHASE_DELIVERY_STATUS_LABELS,
  purchaseOrderSchema,
  type PurchaseOrderInput,
} from "@/lib/validations/purchase-order";
import { VendorSelectField } from "@/components/shared/vendor-select-field";
import { ProjectSelectField } from "@/components/shared/project-select-field";
import type { VendorOption } from "@/lib/data/vendors";
import type { ProjectOption } from "@/lib/data/projects";

export function PurchaseOrderForm({
  vendorOptions,
  projectOptions,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  vendorOptions: VendorOption[];
  projectOptions: ProjectOption[];
  defaultValues?: Partial<PurchaseOrderInput>;
  onSubmit: (values: PurchaseOrderInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseOrderInput>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      vendorId: "",
      projectId: "",
      orderDate: new Date().toISOString().slice(0, 10),
      item: "",
      unit: "",
      gstPct: 18,
      deliveryStatus: "pending",
      ...defaultValues,
    },
  });

  async function submit(values: PurchaseOrderInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <VendorSelectField control={control} name="vendorId" vendorOptions={vendorOptions} error={errors.vendorId?.message} />
      <ProjectSelectField control={control} name="projectId" projectOptions={projectOptions} error={errors.projectId?.message} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="item" label="Item" error={errors.item?.message} required>
          <Input id="item" placeholder="e.g. 18 mm BWR ply, 8 x 4" {...register("item")} />
        </Field>
        <Field id="unit" label="Unit" error={errors.unit?.message} required>
          <Input id="unit" placeholder="e.g. nos, kg, sq ft" {...register("unit")} />
        </Field>
        <Field id="qty" label="Qty" error={errors.qty?.message} required>
          <Input id="qty" type="number" min={0} step="0.01" {...register("qty", { valueAsNumber: true })} />
        </Field>
        <Field id="rate" label="Rate (₹)" error={errors.rate?.message} required>
          <Input id="rate" type="number" min={0} {...register("rate", { valueAsNumber: true })} />
        </Field>
        <Field id="gstPct" label="GST (%)" error={errors.gstPct?.message}>
          <Input id="gstPct" type="number" min={0} max={100} {...register("gstPct", { valueAsNumber: true })} />
        </Field>
        <Field id="orderDate" label="Order date" error={errors.orderDate?.message} required>
          <Input id="orderDate" type="date" {...register("orderDate")} />
        </Field>
        <Field id="deliveryStatus" label="Delivery" error={errors.deliveryStatus?.message} required>
          <Controller
            control={control}
            name="deliveryStatus"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="deliveryStatus" className="w-full">
                  <SelectValue placeholder="Select status">
                    {(value: string | null) =>
                      value
                        ? PURCHASE_DELIVERY_STATUS_LABELS[value as keyof typeof PURCHASE_DELIVERY_STATUS_LABELS]
                        : "Select status"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PURCHASE_DELIVERY_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {PURCHASE_DELIVERY_STATUS_LABELS[status]}
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
