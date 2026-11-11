"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { saveElectricalProjectSettings } from "@/lib/actions/electrical";
import { electricalProjectSettingsSchema, type ElectricalProjectSettingsInput } from "@/lib/validations/electrical";
import type { ElectricalProjectSettingsRow } from "@/lib/data/electrical";

export function ElectricalSettingsForm({
  projectId,
  settings,
}: {
  projectId: string;
  settings: ElectricalProjectSettingsRow | null;
}) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ElectricalProjectSettingsInput>({
    resolver: zodResolver(electricalProjectSettingsSchema),
    defaultValues: settings
      ? {
          dbMcbCost: Number(settings.db_mcb_cost),
          labourSharePct: Number(settings.labour_share_pct) * 100,
          marginPct: Number(settings.margin_pct) * 100,
          roundingUnit: Number(settings.rounding_unit),
        }
      : { dbMcbCost: 15000, labourSharePct: 35, marginPct: 20, roundingUnit: 500 },
  });

  async function submit(values: ElectricalProjectSettingsInput) {
    const result = await saveElectricalProjectSettings(projectId, values);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Electrical settings saved");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Field id="dbMcbCost" label="DB / MCB cost (₹)" error={errors.dbMcbCost?.message}>
          <Input id="dbMcbCost" type="number" step="0.01" {...register("dbMcbCost", { valueAsNumber: true })} />
        </Field>
        <Field id="labourSharePct" label="Labour share in point rates (%)" error={errors.labourSharePct?.message}>
          <Input id="labourSharePct" type="number" step="0.01" {...register("labourSharePct", { valueAsNumber: true })} />
        </Field>
        <Field id="marginPct" label="Margin on price (%)" error={errors.marginPct?.message}>
          <Input id="marginPct" type="number" step="0.01" {...register("marginPct", { valueAsNumber: true })} />
        </Field>
        <Field id="roundingUnit" label="Round to nearest (₹)" error={errors.roundingUnit?.message}>
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
