"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/field";
import { saveKitchenEstimation } from "@/lib/actions/kitchen";
import { autoCornerQty } from "@/lib/calculations/kitchen";
import {
  kitchenEstimationSchema,
  KITCHEN_LAYOUT_TYPES,
  KITCHEN_LAYOUT_LABELS,
  type KitchenEstimationInput,
} from "@/lib/validations/kitchen";
import type { KitchenEstimationRow } from "@/lib/data/kitchen";

export function KitchenSettingsForm({
  projectId,
  estimation,
}: {
  projectId: string;
  estimation: KitchenEstimationRow | null;
}) {
  const router = useRouter();
  const { register, control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<KitchenEstimationInput>({
      resolver: zodResolver(kitchenEstimationSchema),
      defaultValues: estimation
        ? {
            layoutType: estimation.layout_type,
            baseRft: Number(estimation.base_rft),
            wallRft: Number(estimation.wall_rft),
            tallQty: estimation.tall_qty,
            cornerQty: estimation.corner_qty,
            baseRate: Number(estimation.base_rate),
            wallRate: Number(estimation.wall_rate),
            tallRate: Number(estimation.tall_rate),
            cornerRate: Number(estimation.corner_rate),
            countertopArea: Number(estimation.countertop_area),
            countertopRate: Number(estimation.countertop_rate),
            installLabourPct: Number(estimation.install_labour_pct) * 100,
            wastagePct: Number(estimation.wastage_pct) * 100,
            marginPct: Number(estimation.margin_pct) * 100,
            roundingUnit: Number(estimation.rounding_unit),
          }
        : {
            layoutType: "straight", baseRft: 0, wallRft: 0, tallQty: 0, cornerQty: 0,
            baseRate: 1500, wallRate: 1200, tallRate: 18000, cornerRate: 3000,
            countertopArea: 0, countertopRate: 350, installLabourPct: 15, wastagePct: 5,
            marginPct: 20, roundingUnit: 1000,
          },
    });

  const layoutType = watch("layoutType");
  useEffect(() => {
    if (!estimation) setValue("cornerQty", autoCornerQty(layoutType));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutType]);

  async function submit(values: KitchenEstimationInput) {
    const result = await saveKitchenEstimation(projectId, values);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Kitchen estimation saved");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field id="layoutType" label="Layout">
          <Controller
            control={control}
            name="layoutType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="layoutType" className="w-full">
                  <SelectValue>{(v: string | null) => KITCHEN_LAYOUT_LABELS[v as keyof typeof KITCHEN_LAYOUT_LABELS] ?? "Select"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {KITCHEN_LAYOUT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {KITCHEN_LAYOUT_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="baseRft" label="Base cabinet (rft)" error={errors.baseRft?.message}>
          <Input id="baseRft" type="number" step="0.01" {...register("baseRft", { valueAsNumber: true })} />
        </Field>
        <Field id="wallRft" label="Wall cabinet (rft)" error={errors.wallRft?.message}>
          <Input id="wallRft" type="number" step="0.01" {...register("wallRft", { valueAsNumber: true })} />
        </Field>
        <Field id="tallQty" label="Tall units (qty)" error={errors.tallQty?.message}>
          <Input id="tallQty" type="number" {...register("tallQty", { valueAsNumber: true })} />
        </Field>
        <Field id="cornerQty" label="Corner units (qty)" error={errors.cornerQty?.message}>
          <Input id="cornerQty" type="number" {...register("cornerQty", { valueAsNumber: true })} />
        </Field>
        <Field id="countertopArea" label="Countertop area (sqft)" error={errors.countertopArea?.message}>
          <Input id="countertopArea" type="number" step="0.01" {...register("countertopArea", { valueAsNumber: true })} />
        </Field>
        <Field id="baseRate" label="Base rate (₹/rft)" error={errors.baseRate?.message}>
          <Input id="baseRate" type="number" step="0.01" {...register("baseRate", { valueAsNumber: true })} />
        </Field>
        <Field id="wallRate" label="Wall rate (₹/rft)" error={errors.wallRate?.message}>
          <Input id="wallRate" type="number" step="0.01" {...register("wallRate", { valueAsNumber: true })} />
        </Field>
        <Field id="tallRate" label="Tall rate (₹/unit)" error={errors.tallRate?.message}>
          <Input id="tallRate" type="number" step="0.01" {...register("tallRate", { valueAsNumber: true })} />
        </Field>
        <Field id="cornerRate" label="Corner extra (₹/unit)" error={errors.cornerRate?.message}>
          <Input id="cornerRate" type="number" step="0.01" {...register("cornerRate", { valueAsNumber: true })} />
        </Field>
        <Field id="countertopRate" label="Countertop rate (₹/sqft)" error={errors.countertopRate?.message}>
          <Input id="countertopRate" type="number" step="0.01" {...register("countertopRate", { valueAsNumber: true })} />
        </Field>
        <Field id="installLabourPct" label="Install labour (%)" error={errors.installLabourPct?.message}>
          <Input id="installLabourPct" type="number" step="0.01" {...register("installLabourPct", { valueAsNumber: true })} />
        </Field>
        <Field id="wastagePct" label="Wastage (%)" error={errors.wastagePct?.message}>
          <Input id="wastagePct" type="number" step="0.01" {...register("wastagePct", { valueAsNumber: true })} />
        </Field>
        <Field id="marginPct" label="Margin on price (%)" error={errors.marginPct?.message}>
          <Input id="marginPct" type="number" step="0.01" {...register("marginPct", { valueAsNumber: true })} />
        </Field>
        <Field id="roundingUnit" label="Round price to nearest (₹)" error={errors.roundingUnit?.message}>
          <Input id="roundingUnit" type="number" step="1" {...register("roundingUnit", { valueAsNumber: true })} />
        </Field>
      </div>
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save kitchen estimation"}
        </Button>
      </div>
    </form>
  );
}
