"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { savePlywoodProjectSettings } from "@/lib/actions/plywood";
import { plywoodProjectSettingsSchema, type PlywoodProjectSettingsInput } from "@/lib/validations/plywood";
import type { PlywoodProjectSettingsRow } from "@/lib/data/plywood";

export function PlywoodSettingsForm({
  projectId,
  settings,
}: {
  projectId: string;
  settings: PlywoodProjectSettingsRow | null;
}) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PlywoodProjectSettingsInput>({
    resolver: zodResolver(plywoodProjectSettingsSchema),
    defaultValues: settings
      ? {
          laminateRatePerSheet: Number(settings.laminate_rate_per_sheet),
          edgeBandRatePerRft: Number(settings.edge_band_rate_per_rft),
          fixingsPct: Number(settings.fixings_pct) * 100,
          marginPct: Number(settings.margin_pct) * 100,
          roundingUnit: Number(settings.rounding_unit),
        }
      : { laminateRatePerSheet: 1200, edgeBandRatePerRft: 15, fixingsPct: 3, marginPct: 20, roundingUnit: 500 },
  });

  async function submit(values: PlywoodProjectSettingsInput) {
    const result = await savePlywoodProjectSettings(projectId, values);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Plywood & laminate settings saved");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field id="laminateRatePerSheet" label="Laminate rate (₹/sheet)" error={errors.laminateRatePerSheet?.message}>
          <Input id="laminateRatePerSheet" type="number" step="0.01" {...register("laminateRatePerSheet", { valueAsNumber: true })} />
        </Field>
        <Field id="edgeBandRatePerRft" label="Edge band rate (₹/rft)" error={errors.edgeBandRatePerRft?.message}>
          <Input id="edgeBandRatePerRft" type="number" step="0.01" {...register("edgeBandRatePerRft", { valueAsNumber: true })} />
        </Field>
        <Field id="fixingsPct" label="Fixings (% of boards+laminate)" error={errors.fixingsPct?.message}>
          <Input id="fixingsPct" type="number" step="0.01" {...register("fixingsPct", { valueAsNumber: true })} />
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
          {isSubmitting ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
