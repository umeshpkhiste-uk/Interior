"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { DialogFooter } from "@/components/ui/dialog";
import { snagSchema, type SnagInput } from "@/lib/validations/snag";
import { ProjectSelectField } from "./project-select-field";
import type { ProjectOption } from "@/lib/data/projects";

export function SnagForm({
  projectOptions,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  projectOptions: ProjectOption[];
  defaultValues?: Partial<SnagInput>;
  onSubmit: (values: SnagInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SnagInput>({
    resolver: zodResolver(snagSchema),
    defaultValues: {
      projectId: "",
      roomArea: "",
      item: "",
      issue: "",
      foundOn: new Date().toISOString().slice(0, 10),
      assignedTo: "",
      fixBy: "",
      fixedOn: "",
      ...defaultValues,
    },
  });

  async function submit(values: SnagInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <ProjectSelectField control={control} name="projectId" projectOptions={projectOptions} error={errors.projectId?.message} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="roomArea" label="Room / area" error={errors.roomArea?.message}>
          <Input id="roomArea" {...register("roomArea")} />
        </Field>
        <Field id="item" label="Item" error={errors.item?.message} required>
          <Input id="item" placeholder="e.g. Shutter, Drawer, Light" {...register("item")} />
        </Field>
        <Field id="foundOn" label="Found on" error={errors.foundOn?.message} required>
          <Input id="foundOn" type="date" {...register("foundOn")} />
        </Field>
        <Field id="assignedTo" label="Assigned to" error={errors.assignedTo?.message}>
          <Input id="assignedTo" placeholder="e.g. Carpenter team A, Electrician" {...register("assignedTo")} />
        </Field>
        <Field id="fixBy" label="Fix by" error={errors.fixBy?.message}>
          <Input id="fixBy" type="date" {...register("fixBy")} />
        </Field>
        <Field id="fixedOn" label="Fixed on" error={errors.fixedOn?.message}>
          <Input id="fixedOn" type="date" {...register("fixedOn")} />
        </Field>
      </div>

      <Field id="issue" label="Issue" error={errors.issue?.message} required>
        <Textarea id="issue" rows={2} {...register("issue")} />
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
