"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { DialogFooter } from "@/components/ui/dialog";
import { siteVisitSchema, type SiteVisitInput } from "@/lib/validations/site-visit";
import { ProjectSelectField } from "@/components/shared/project-select-field";
import type { ProjectOption } from "@/lib/data/projects";

export function SiteVisitForm({
  projectOptions,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  projectOptions: ProjectOption[];
  defaultValues?: Partial<SiteVisitInput>;
  onSubmit: (values: SiteVisitInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SiteVisitInput>({
    resolver: zodResolver(siteVisitSchema),
    defaultValues: {
      projectId: "",
      visitDate: new Date().toISOString().slice(0, 10),
      visitedBy: "",
      purpose: "",
      notes: "",
      ...defaultValues,
    },
  });

  async function submit(values: SiteVisitInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <ProjectSelectField control={control} name="projectId" projectOptions={projectOptions} error={errors.projectId?.message} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="visitDate" label="Visit date" error={errors.visitDate?.message} required>
          <Input id="visitDate" type="date" {...register("visitDate")} />
        </Field>
        <Field id="visitedBy" label="Visited by" error={errors.visitedBy?.message}>
          <Input id="visitedBy" placeholder="e.g. Site supervisor, Designer" {...register("visitedBy")} />
        </Field>
        <Field id="purpose" label="Purpose" error={errors.purpose?.message}>
          <Input id="purpose" placeholder="e.g. Material check, Snag check" {...register("purpose")} />
        </Field>
        <Field id="workDonePct" label="Work done (%)" error={errors.workDonePct?.message}>
          <Input id="workDonePct" type="number" min={0} max={100} {...register("workDonePct", { valueAsNumber: true })} />
        </Field>
        <Field id="nextVisitInDays" label="Next visit in (days)" error={errors.nextVisitInDays?.message}>
          <Input id="nextVisitInDays" type="number" min={0} {...register("nextVisitInDays", { valueAsNumber: true })} />
        </Field>
      </div>

      <Field id="notes" label="Notes" error={errors.notes?.message}>
        <Textarea id="notes" rows={2} {...register("notes")} />
      </Field>

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
