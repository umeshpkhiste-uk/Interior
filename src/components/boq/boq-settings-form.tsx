"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { saveBoqSettings } from "@/lib/actions/boq";
import { boqSettingsSchema, type BoqSettingsInput } from "@/lib/validations/boq";
import type { BoqSettingsRow } from "@/lib/data/boq";

export function BoqSettingsForm({ projectId, settings }: { projectId: string; settings: BoqSettingsRow | null }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<BoqSettingsInput>({
    resolver: zodResolver(boqSettingsSchema),
    defaultValues: settings
      ? { contingencyPct: Number(settings.contingency_pct) * 100, gstPct: Number(settings.gst_pct) * 100 }
      : { contingencyPct: 5, gstPct: 18 },
  });

  async function submit(values: BoqSettingsInput) {
    const result = await saveBoqSettings(projectId, values);
    if (result.error) toast.error(result.error);
    else {
      toast.success("BOQ settings saved");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-wrap items-end gap-3">
      <Field id="contingencyPct" label="Contingency (%)" error={errors.contingencyPct?.message}>
        <Input id="contingencyPct" type="number" step="0.01" className="w-32" {...register("contingencyPct", { valueAsNumber: true })} />
      </Field>
      <Field id="gstPct" label="GST (%)" error={errors.gstPct?.message}>
        <Input id="gstPct" type="number" step="0.01" className="w-32" {...register("gstPct", { valueAsNumber: true })} />
      </Field>
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
