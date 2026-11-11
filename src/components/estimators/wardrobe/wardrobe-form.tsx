"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/shared/field";
import { wardrobeSchema, SHUTTER_TYPES, SHUTTER_TYPE_LABELS, type WardrobeInput } from "@/lib/validations/wardrobe";
import type { RoomOption } from "@/lib/data/rooms";

export function WardrobeForm({
  defaultValues,
  rooms,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  defaultValues?: Partial<WardrobeInput>;
  rooms: RoomOption[];
  onSubmit: (values: WardrobeInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<WardrobeInput>({
    resolver: zodResolver(wardrobeSchema),
    defaultValues: {
      name: "", roomId: "", width: 8, height: 7, depth: 2, shutterType: "hinged",
      hingedRate: 1500, slidingRate: 1800, hasLoft: false, loftHeight: 2, loftRate: 800,
      installLabourPct: 10, marginPct: 20, roundingUnit: 500,
      ...defaultValues,
    },
  });
  const hasLoft = watch("hasLoft");

  async function submit(values: WardrobeInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="name" label="Name" error={errors.name?.message} required>
          <Input id="name" {...register("name")} />
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
        <Field id="width" label="Width (ft)" error={errors.width?.message} required>
          <Input id="width" type="number" step="0.01" {...register("width", { valueAsNumber: true })} />
        </Field>
        <Field id="height" label="Height (ft)" error={errors.height?.message} required>
          <Input id="height" type="number" step="0.01" {...register("height", { valueAsNumber: true })} />
        </Field>
        <Field id="depth" label="Depth (ft)" error={errors.depth?.message}>
          <Input id="depth" type="number" step="0.01" {...register("depth", { valueAsNumber: true })} />
        </Field>
        <Field id="shutterType" label="Shutter type">
          <Controller
            control={control}
            name="shutterType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="shutterType" className="w-full">
                  <SelectValue>{(v: string | null) => SHUTTER_TYPE_LABELS[v as keyof typeof SHUTTER_TYPE_LABELS] ?? "Select"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SHUTTER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {SHUTTER_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="hingedRate" label="Hinged rate (₹/sqft)" error={errors.hingedRate?.message}>
          <Input id="hingedRate" type="number" step="0.01" {...register("hingedRate", { valueAsNumber: true })} />
        </Field>
        <Field id="slidingRate" label="Sliding rate (₹/sqft)" error={errors.slidingRate?.message}>
          <Input id="slidingRate" type="number" step="0.01" {...register("slidingRate", { valueAsNumber: true })} />
        </Field>
        <div className="flex items-center gap-2 pt-6">
          <Controller
            control={control}
            name="hasLoft"
            render={({ field }) => (
              <Checkbox id="hasLoft" checked={field.value} onCheckedChange={(c) => field.onChange(Boolean(c))} />
            )}
          />
          <label htmlFor="hasLoft" className="text-sm">
            Has loft
          </label>
        </div>
        {hasLoft && (
          <>
            <Field id="loftHeight" label="Loft height (ft)" error={errors.loftHeight?.message}>
              <Input id="loftHeight" type="number" step="0.01" {...register("loftHeight", { valueAsNumber: true })} />
            </Field>
            <Field id="loftRate" label="Loft rate (₹/sqft)" error={errors.loftRate?.message}>
              <Input id="loftRate" type="number" step="0.01" {...register("loftRate", { valueAsNumber: true })} />
            </Field>
          </>
        )}
        <Field id="installLabourPct" label="Install labour (%)" error={errors.installLabourPct?.message}>
          <Input id="installLabourPct" type="number" step="0.01" {...register("installLabourPct", { valueAsNumber: true })} />
        </Field>
        <Field id="marginPct" label="Margin on price (%)" error={errors.marginPct?.message}>
          <Input id="marginPct" type="number" step="0.01" {...register("marginPct", { valueAsNumber: true })} />
        </Field>
        <Field id="roundingUnit" label="Round price to nearest (₹)" error={errors.roundingUnit?.message}>
          <Input id="roundingUnit" type="number" step="1" {...register("roundingUnit", { valueAsNumber: true })} />
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
