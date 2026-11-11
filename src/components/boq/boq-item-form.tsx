"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/shared/field";
import { boqItemSchema, type BoqItemInput } from "@/lib/validations/boq";
import type { RoomOption } from "@/lib/data/rooms";

export function BoqItemForm({
  defaultValues,
  rooms,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  defaultValues?: Partial<BoqItemInput>;
  rooms: RoomOption[];
  onSubmit: (values: BoqItemInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<BoqItemInput>({
    resolver: zodResolver(boqItemSchema),
    defaultValues: {
      roomId: "", workCategory: "", itemDescription: "", specification: "", brand: "", unit: "lot",
      quantity: 1, materialRate: 0, labourRate: 0,
      ...defaultValues,
    },
  });

  async function submit(values: BoqItemInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="itemDescription" label="Item description" error={errors.itemDescription?.message} required>
          <Input id="itemDescription" {...register("itemDescription")} />
        </Field>
        <Field id="roomId" label="Room">
          <Controller
            control={control}
            name="roomId"
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger id="roomId" className="w-full">
                  <SelectValue>{() => rooms.find((r) => r.id === field.value)?.name ?? "No room"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No room</SelectItem>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="workCategory" label="Work category">
          <Input id="workCategory" {...register("workCategory")} />
        </Field>
        <Field id="specification" label="Specification">
          <Input id="specification" {...register("specification")} />
        </Field>
        <Field id="brand" label="Brand">
          <Input id="brand" {...register("brand")} />
        </Field>
        <Field id="unit" label="Unit">
          <Input id="unit" {...register("unit")} />
        </Field>
        <Field id="quantity" label="Quantity" error={errors.quantity?.message}>
          <Input id="quantity" type="number" step="0.01" {...register("quantity", { valueAsNumber: true })} />
        </Field>
        <Field id="materialRate" label="Material rate (₹)" error={errors.materialRate?.message}>
          <Input id="materialRate" type="number" step="0.01" {...register("materialRate", { valueAsNumber: true })} />
        </Field>
        <Field id="labourRate" label="Labour rate (₹)" error={errors.labourRate?.message}>
          <Input id="labourRate" type="number" step="0.01" {...register("labourRate", { valueAsNumber: true })} />
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
