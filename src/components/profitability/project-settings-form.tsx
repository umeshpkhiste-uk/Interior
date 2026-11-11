"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { saveProjectSettings } from "@/lib/actions/profitability";
import { projectSettingsSchema, type ProjectSettingsInput } from "@/lib/validations/profitability";
import type { ProjectSettingsRow } from "@/lib/data/profitability";

export function ProjectSettingsForm({ projectId, settings }: { projectId: string; settings: ProjectSettingsRow | null }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProjectSettingsInput>({
    resolver: zodResolver(projectSettingsSchema),
    defaultValues: settings
      ? {
          overheadPct: Number(settings.overhead_pct) * 100,
          supervisorMonthlyCost: Number(settings.supervisor_monthly_cost),
          projectDurationMonths: Number(settings.project_duration_months),
          targetMarginPct: Number(settings.target_margin_pct) * 100,
          otherHeadMaterialCost: Number(settings.other_head_material_cost),
          otherHeadLabourCost: Number(settings.other_head_labour_cost),
        }
      : { overheadPct: 10, supervisorMonthlyCost: 0, projectDurationMonths: 0, targetMarginPct: 20, otherHeadMaterialCost: 0, otherHeadLabourCost: 0 },
  });

  async function submit(values: ProjectSettingsInput) {
    const result = await saveProjectSettings(projectId, values);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Profitability settings saved");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field id="overheadPct" label="Overhead (% of material+labour)" error={errors.overheadPct?.message}>
          <Input id="overheadPct" type="number" step="0.01" {...register("overheadPct", { valueAsNumber: true })} />
        </Field>
        <Field id="targetMarginPct" label="Target margin (%)" error={errors.targetMarginPct?.message}>
          <Input id="targetMarginPct" type="number" step="0.01" {...register("targetMarginPct", { valueAsNumber: true })} />
        </Field>
        <Field id="supervisorMonthlyCost" label="Supervisor cost (₹/month)" error={errors.supervisorMonthlyCost?.message}>
          <Input id="supervisorMonthlyCost" type="number" step="0.01" {...register("supervisorMonthlyCost", { valueAsNumber: true })} />
        </Field>
        <Field id="projectDurationMonths" label="Project duration (months)" error={errors.projectDurationMonths?.message}>
          <Input id="projectDurationMonths" type="number" step="0.01" {...register("projectDurationMonths", { valueAsNumber: true })} />
        </Field>
        <Field id="otherHeadMaterialCost" label="Other carpentry — material cost (₹)" error={errors.otherHeadMaterialCost?.message}>
          <Input id="otherHeadMaterialCost" type="number" step="0.01" {...register("otherHeadMaterialCost", { valueAsNumber: true })} />
        </Field>
        <Field id="otherHeadLabourCost" label="Other carpentry — labour cost (₹)" error={errors.otherHeadLabourCost?.message}>
          <Input id="otherHeadLabourCost" type="number" step="0.01" {...register("otherHeadLabourCost", { valueAsNumber: true })} />
        </Field>
      </div>
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
