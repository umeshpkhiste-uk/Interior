"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/field";
import { saveFlooringEstimation } from "@/lib/actions/flooring";
import {
  flooringEstimationSchema,
  FLOORING_TYPES,
  FLOORING_TYPE_LABELS,
  type FlooringEstimationInput,
} from "@/lib/validations/flooring";
import type { FlooringEstimationRow } from "@/lib/data/flooring";

export function FlooringEstimationForm({
  roomId,
  projectId,
  estimation,
}: {
  roomId: string;
  projectId: string;
  estimation: FlooringEstimationRow | null;
}) {
  const router = useRouter();
  const { register, control, watch, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FlooringEstimationInput>({
      resolver: zodResolver(flooringEstimationSchema),
      defaultValues: estimation
        ? {
            flooringType: estimation.flooring_type,
            tileLength: Number(estimation.tile_length ?? 0),
            tileWidth: Number(estimation.tile_width ?? 0),
            pricePerBox: Number(estimation.price_per_box ?? 0),
            piecesPerBox: estimation.pieces_per_box ?? 0,
            wastagePct: Number(estimation.wastage_pct) * 100,
            layingLabourRate: Number(estimation.laying_labour_rate ?? 0),
            adhesiveGroutRate: Number(estimation.adhesive_grout_rate ?? 0),
            skirtingLength: Number(estimation.skirting_length),
            skirtingRate: Number(estimation.skirting_rate),
            marginPct: Number(estimation.margin_pct) * 100,
            roundingUnit: Number(estimation.rounding_unit),
          }
        : {
            flooringType: "vitrified", tileLength: 2, tileWidth: 2, pricePerBox: 1800, piecesPerBox: 4,
            wastagePct: 10, layingLabourRate: 25, adhesiveGroutRate: 10, skirtingLength: 0, skirtingRate: 35,
            marginPct: 20, roundingUnit: 500,
          },
    });

  const flooringType = watch("flooringType");

  async function submit(values: FlooringEstimationInput) {
    const result = await saveFlooringEstimation(roomId, projectId, values);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Flooring estimation saved");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field id={`flooringType-${roomId}`} label="Flooring type">
          <Controller
            control={control}
            name="flooringType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={`flooringType-${roomId}`} className="w-full" size="sm">
                  <SelectValue>{(v: string | null) => FLOORING_TYPE_LABELS[v as keyof typeof FLOORING_TYPE_LABELS] ?? "Select"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FLOORING_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {FLOORING_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        {flooringType !== "no_work" && (
          <>
            <Field id={`tileLength-${roomId}`} label="Tile length (ft)" error={errors.tileLength?.message}>
              <Input id={`tileLength-${roomId}`} type="number" step="0.01" {...register("tileLength", { valueAsNumber: true })} />
            </Field>
            <Field id={`tileWidth-${roomId}`} label="Tile width (ft)" error={errors.tileWidth?.message}>
              <Input id={`tileWidth-${roomId}`} type="number" step="0.01" {...register("tileWidth", { valueAsNumber: true })} />
            </Field>
            <Field id={`pricePerBox-${roomId}`} label="Price per box (₹)" error={errors.pricePerBox?.message}>
              <Input id={`pricePerBox-${roomId}`} type="number" step="0.01" {...register("pricePerBox", { valueAsNumber: true })} />
            </Field>
            <Field id={`piecesPerBox-${roomId}`} label="Pieces per box" error={errors.piecesPerBox?.message}>
              <Input id={`piecesPerBox-${roomId}`} type="number" {...register("piecesPerBox", { valueAsNumber: true })} />
            </Field>
            <Field id={`wastagePct-${roomId}`} label="Wastage (%)" error={errors.wastagePct?.message}>
              <Input id={`wastagePct-${roomId}`} type="number" step="0.01" {...register("wastagePct", { valueAsNumber: true })} />
            </Field>
            <Field id={`layingLabourRate-${roomId}`} label="Laying labour (₹/sqft)" error={errors.layingLabourRate?.message}>
              <Input id={`layingLabourRate-${roomId}`} type="number" step="0.01" {...register("layingLabourRate", { valueAsNumber: true })} />
            </Field>
            <Field id={`adhesiveGroutRate-${roomId}`} label="Adhesive/grout (₹/sqft)" error={errors.adhesiveGroutRate?.message}>
              <Input id={`adhesiveGroutRate-${roomId}`} type="number" step="0.01" {...register("adhesiveGroutRate", { valueAsNumber: true })} />
            </Field>
            <Field id={`skirtingLength-${roomId}`} label="Skirting length (rft)" error={errors.skirtingLength?.message}>
              <Input id={`skirtingLength-${roomId}`} type="number" step="0.01" {...register("skirtingLength", { valueAsNumber: true })} />
            </Field>
            <Field id={`skirtingRate-${roomId}`} label="Skirting rate (₹/rft)" error={errors.skirtingRate?.message}>
              <Input id={`skirtingRate-${roomId}`} type="number" step="0.01" {...register("skirtingRate", { valueAsNumber: true })} />
            </Field>
            <Field id={`marginPct-${roomId}`} label="Margin on price (%)" error={errors.marginPct?.message}>
              <Input id={`marginPct-${roomId}`} type="number" step="0.01" {...register("marginPct", { valueAsNumber: true })} />
            </Field>
            <Field id={`roundingUnit-${roomId}`} label="Round to nearest (₹)" error={errors.roundingUnit?.message}>
              <Input id={`roundingUnit-${roomId}`} type="number" step="1" {...register("roundingUnit", { valueAsNumber: true })} />
            </Field>
          </>
        )}
      </div>
      <div>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
