"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/field";
import { saveCeilingEstimation } from "@/lib/actions/false-ceiling";
import {
  ceilingEstimationSchema,
  CEILING_TYPES,
  CEILING_TYPE_LABELS,
  CEILING_DESIGNS,
  CEILING_DESIGN_LABELS,
  type CeilingEstimationInput,
} from "@/lib/validations/false-ceiling";
import type { CeilingEstimationRow } from "@/lib/data/false-ceiling";

export function CeilingEstimationForm({
  roomId,
  projectId,
  estimation,
}: {
  roomId: string;
  projectId: string;
  estimation: CeilingEstimationRow | null;
}) {
  const router = useRouter();
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<CeilingEstimationInput>({
    resolver: zodResolver(ceilingEstimationSchema),
    defaultValues: estimation
      ? {
          ceilingType: estimation.ceiling_type,
          coverPct: Number(estimation.cover_pct) * 100,
          design: estimation.design,
          coveLength: Number(estimation.cove_length),
          ledStripLength: Number(estimation.led_strip_length),
          downlightQty: estimation.downlight_qty,
          materialRate: Number(estimation.material_rate),
          labourRate: Number(estimation.labour_rate),
          boardDimensions: estimation.board_dimensions ?? "",
          wastagePct: Number(estimation.wastage_pct) * 100,
          lightingRate: Number(estimation.lighting_rate),
          ledStripRate: Number(estimation.led_strip_rate),
          coveLabourRate: Number(estimation.cove_labour_rate),
          marginPct: Number(estimation.margin_pct) * 100,
          roundingUnit: Number(estimation.rounding_unit),
        }
      : {
          ceilingType: "gypsum", coverPct: 100, design: "none", coveLength: 0, ledStripLength: 0,
          downlightQty: 0, materialRate: 55, labourRate: 30, wastagePct: 5, lightingRate: 250,
          ledStripRate: 90, coveLabourRate: 20, marginPct: 20, roundingUnit: 500,
        },
  });

  async function submit(values: CeilingEstimationInput) {
    const result = await saveCeilingEstimation(roomId, projectId, values);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Ceiling estimation saved");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field id={`ceilingType-${roomId}`} label="Ceiling type">
          <Controller
            control={control}
            name="ceilingType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={`ceilingType-${roomId}`} className="w-full" size="sm">
                  <SelectValue>{(v: string | null) => CEILING_TYPE_LABELS[v as keyof typeof CEILING_TYPE_LABELS] ?? "Select"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CEILING_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {CEILING_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id={`design-${roomId}`} label="Design">
          <Controller
            control={control}
            name="design"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={`design-${roomId}`} className="w-full" size="sm">
                  <SelectValue>{(v: string | null) => CEILING_DESIGN_LABELS[v as keyof typeof CEILING_DESIGN_LABELS] ?? "Select"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CEILING_DESIGNS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {CEILING_DESIGN_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id={`coverPct-${roomId}`} label="Coverage (%)" error={errors.coverPct?.message}>
          <Input id={`coverPct-${roomId}`} type="number" step="0.01" {...register("coverPct", { valueAsNumber: true })} />
        </Field>
        <Field id={`coveLength-${roomId}`} label="Cove length (rft)" error={errors.coveLength?.message}>
          <Input id={`coveLength-${roomId}`} type="number" step="0.01" {...register("coveLength", { valueAsNumber: true })} />
        </Field>
        <Field id={`downlightQty-${roomId}`} label="Downlights (qty)" error={errors.downlightQty?.message}>
          <Input id={`downlightQty-${roomId}`} type="number" {...register("downlightQty", { valueAsNumber: true })} />
        </Field>
        <Field id={`materialRate-${roomId}`} label="Material rate (₹/sqft)" error={errors.materialRate?.message}>
          <Input id={`materialRate-${roomId}`} type="number" step="0.01" {...register("materialRate", { valueAsNumber: true })} />
        </Field>
        <Field id={`labourRate-${roomId}`} label="Labour rate (₹/sqft)" error={errors.labourRate?.message}>
          <Input id={`labourRate-${roomId}`} type="number" step="0.01" {...register("labourRate", { valueAsNumber: true })} />
        </Field>
        <Field id={`lightingRate-${roomId}`} label="Downlight rate (₹/pt)" error={errors.lightingRate?.message}>
          <Input id={`lightingRate-${roomId}`} type="number" step="0.01" {...register("lightingRate", { valueAsNumber: true })} />
        </Field>
        <Field id={`ledStripRate-${roomId}`} label="LED strip rate (₹/rft)" error={errors.ledStripRate?.message}>
          <Input id={`ledStripRate-${roomId}`} type="number" step="0.01" {...register("ledStripRate", { valueAsNumber: true })} />
        </Field>
        <Field id={`coveLabourRate-${roomId}`} label="Cove labour rate (₹/rft)" error={errors.coveLabourRate?.message}>
          <Input id={`coveLabourRate-${roomId}`} type="number" step="0.01" {...register("coveLabourRate", { valueAsNumber: true })} />
        </Field>
        <Field id={`wastagePct-${roomId}`} label="Wastage (%)" error={errors.wastagePct?.message}>
          <Input id={`wastagePct-${roomId}`} type="number" step="0.01" {...register("wastagePct", { valueAsNumber: true })} />
        </Field>
        <Field id={`marginPct-${roomId}`} label="Margin on price (%)" error={errors.marginPct?.message}>
          <Input id={`marginPct-${roomId}`} type="number" step="0.01" {...register("marginPct", { valueAsNumber: true })} />
        </Field>
        <Field id={`roundingUnit-${roomId}`} label="Round to nearest (₹)" error={errors.roundingUnit?.message}>
          <Input id={`roundingUnit-${roomId}`} type="number" step="1" {...register("roundingUnit", { valueAsNumber: true })} />
        </Field>
      </div>
      <div>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
