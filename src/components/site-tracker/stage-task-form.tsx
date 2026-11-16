"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { DialogFooter } from "@/components/ui/dialog";
import { stageTaskSchema, type StageTaskInput } from "@/lib/validations/stage-task";
import { ProjectSelectField } from "@/components/shared/project-select-field";
import type { ProjectOption } from "@/lib/data/projects";

export function StageTaskForm({
  projectOptions,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  projectOptions: ProjectOption[];
  defaultValues?: Partial<StageTaskInput>;
  onSubmit: (values: StageTaskInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StageTaskInput>({
    resolver: zodResolver(stageTaskSchema),
    defaultValues: {
      projectId: "",
      stage: "",
      task: "",
      doneBy: "",
      plannedDate: "",
      doneOn: "",
      ...defaultValues,
    },
  });

  async function submit(values: StageTaskInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <ProjectSelectField control={control} name="projectId" projectOptions={projectOptions} error={errors.projectId?.message} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="stage" label="Stage" error={errors.stage?.message} required>
          <Input id="stage" placeholder="e.g. Design, Carpentry" {...register("stage")} />
        </Field>
        <Field id="task" label="Task" error={errors.task?.message} required>
          <Input id="task" placeholder="e.g. Site measurement" {...register("task")} />
        </Field>
        <Field id="doneBy" label="Done by" error={errors.doneBy?.message}>
          <Input id="doneBy" placeholder="e.g. Designer, Carpenter team A" {...register("doneBy")} />
        </Field>
        <Field id="plannedDate" label="Planned date" error={errors.plannedDate?.message}>
          <Input id="plannedDate" type="date" {...register("plannedDate")} />
        </Field>
        <Field id="doneOn" label="Done on" error={errors.doneOn?.message}>
          <Input id="doneOn" type="date" {...register("doneOn")} />
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
