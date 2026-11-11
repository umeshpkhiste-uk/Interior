"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/shared/field";
import { paintEstimationSchema, type PaintEstimationInput } from "@/lib/validations/paint";
import type { RoomOption } from "@/lib/data/rooms";

export function PaintForm({
  defaultValues,
  rooms,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  defaultValues?: Partial<PaintEstimationInput>;
  rooms: RoomOption[];
  onSubmit: (values: PaintEstimationInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<PaintEstimationInput>({
    resolver: zodResolver(paintEstimationSchema),
    defaultValues: {
      roomId: "", netWallArea: 0, ceilingArea: 0, featureWallArea: 0, coats: 2,
      paintCoveragePerLitre: 120, primerCoverage: 140, puttyCoverage: 20, canSize: 10,
      paintRate: 300, primerRate: 150, puttyRate: 25, labourRate: 18,
      wallpaperRollLength: 33, wallpaperRollWidth: 1.75, wallpaperRate: 2500, wallpaperFixingRate: 400,
      wastagePct: 10, paintBrand: "", finishType: "", marginPct: 20, roundingUnit: 500,
      ...defaultValues,
    },
  });

  async function submit(values: PaintEstimationInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field id="roomId" label="Room">
          <Controller
            control={control}
            name="roomId"
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger id="roomId" className="w-full">
                  <SelectValue>{() => rooms.find((r) => r.id === field.value)?.name ?? "Whole project"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Whole project</SelectItem>
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
        <Field id="netWallArea" label="Net wall area (sqft)" error={errors.netWallArea?.message}>
          <Input id="netWallArea" type="number" step="0.01" {...register("netWallArea", { valueAsNumber: true })} />
        </Field>
        <Field id="ceilingArea" label="Ceiling area (sqft)" error={errors.ceilingArea?.message}>
          <Input id="ceilingArea" type="number" step="0.01" {...register("ceilingArea", { valueAsNumber: true })} />
        </Field>
        <Field id="featureWallArea" label="Feature wall area (sqft)" error={errors.featureWallArea?.message}>
          <Input id="featureWallArea" type="number" step="0.01" {...register("featureWallArea", { valueAsNumber: true })} />
        </Field>
        <Field id="coats" label="Coats" error={errors.coats?.message}>
          <Input id="coats" type="number" {...register("coats", { valueAsNumber: true })} />
        </Field>
        <Field id="paintCoveragePerLitre" label="Paint coverage (sqft/L)" error={errors.paintCoveragePerLitre?.message}>
          <Input id="paintCoveragePerLitre" type="number" step="0.01" {...register("paintCoveragePerLitre", { valueAsNumber: true })} />
        </Field>
        <Field id="primerCoverage" label="Primer coverage (sqft/L)" error={errors.primerCoverage?.message}>
          <Input id="primerCoverage" type="number" step="0.01" {...register("primerCoverage", { valueAsNumber: true })} />
        </Field>
        <Field id="puttyCoverage" label="Putty coverage (sqft/kg)" error={errors.puttyCoverage?.message}>
          <Input id="puttyCoverage" type="number" step="0.01" {...register("puttyCoverage", { valueAsNumber: true })} />
        </Field>
        <Field id="canSize" label="Paint can size (L)" error={errors.canSize?.message}>
          <Input id="canSize" type="number" step="0.01" {...register("canSize", { valueAsNumber: true })} />
        </Field>
        <Field id="paintRate" label="Paint rate (₹/L)" error={errors.paintRate?.message}>
          <Input id="paintRate" type="number" step="0.01" {...register("paintRate", { valueAsNumber: true })} />
        </Field>
        <Field id="primerRate" label="Primer rate (₹/L)" error={errors.primerRate?.message}>
          <Input id="primerRate" type="number" step="0.01" {...register("primerRate", { valueAsNumber: true })} />
        </Field>
        <Field id="puttyRate" label="Putty rate (₹/kg)" error={errors.puttyRate?.message}>
          <Input id="puttyRate" type="number" step="0.01" {...register("puttyRate", { valueAsNumber: true })} />
        </Field>
        <Field id="labourRate" label="Paint labour (₹/sqft)" error={errors.labourRate?.message}>
          <Input id="labourRate" type="number" step="0.01" {...register("labourRate", { valueAsNumber: true })} />
        </Field>
        <Field id="wallpaperRollLength" label="Wallpaper roll length (ft)" error={errors.wallpaperRollLength?.message}>
          <Input id="wallpaperRollLength" type="number" step="0.01" {...register("wallpaperRollLength", { valueAsNumber: true })} />
        </Field>
        <Field id="wallpaperRollWidth" label="Wallpaper roll width (ft)" error={errors.wallpaperRollWidth?.message}>
          <Input id="wallpaperRollWidth" type="number" step="0.01" {...register("wallpaperRollWidth", { valueAsNumber: true })} />
        </Field>
        <Field id="wallpaperRate" label="Wallpaper rate (₹/roll)" error={errors.wallpaperRate?.message}>
          <Input id="wallpaperRate" type="number" step="0.01" {...register("wallpaperRate", { valueAsNumber: true })} />
        </Field>
        <Field id="wallpaperFixingRate" label="Wallpaper fixing (₹/roll)" error={errors.wallpaperFixingRate?.message}>
          <Input id="wallpaperFixingRate" type="number" step="0.01" {...register("wallpaperFixingRate", { valueAsNumber: true })} />
        </Field>
        <Field id="wastagePct" label="Wallpaper wastage (%)" error={errors.wastagePct?.message}>
          <Input id="wastagePct" type="number" step="0.01" {...register("wastagePct", { valueAsNumber: true })} />
        </Field>
        <Field id="paintBrand" label="Paint brand">
          <Input id="paintBrand" {...register("paintBrand")} />
        </Field>
        <Field id="finishType" label="Finish type">
          <Input id="finishType" {...register("finishType")} />
        </Field>
        <Field id="marginPct" label="Margin on price (%)" error={errors.marginPct?.message}>
          <Input id="marginPct" type="number" step="0.01" {...register("marginPct", { valueAsNumber: true })} />
        </Field>
        <Field id="roundingUnit" label="Round to nearest (₹)" error={errors.roundingUnit?.message}>
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
