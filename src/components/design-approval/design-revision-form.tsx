"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import {
  DESIGN_REVISION_REPLY_STATUSES,
  DESIGN_REVISION_REPLY_STATUS_LABELS,
  designRevisionSchema,
  type DesignRevisionInput,
} from "@/lib/validations/design-revision";
import { ProjectSelectField } from "./project-select-field";
import type { ProjectOption } from "@/lib/data/projects";

export function DesignRevisionForm({
  projectOptions,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  projectOptions: ProjectOption[];
  defaultValues?: Partial<DesignRevisionInput>;
  onSubmit: (values: DesignRevisionInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DesignRevisionInput>({
    resolver: zodResolver(designRevisionSchema),
    defaultValues: {
      projectId: "",
      roomArea: "",
      drawing: "",
      version: "R1",
      clientAskedFor: "",
      sentOn: new Date().toISOString().slice(0, 10),
      replyOn: "",
      replyStatus: "waiting",
      ...defaultValues,
    },
  });

  async function submit(values: DesignRevisionInput) {
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
        <Field id="drawing" label="Drawing" error={errors.drawing?.message} required>
          <Input id="drawing" placeholder="e.g. Layout plan, 3D view" {...register("drawing")} />
        </Field>
        <Field id="version" label="Version" error={errors.version?.message} required>
          <Input id="version" {...register("version")} />
        </Field>
        <Field id="sentOn" label="Sent on" error={errors.sentOn?.message} required>
          <Input id="sentOn" type="date" {...register("sentOn")} />
        </Field>
        <Field id="replyOn" label="Reply on" error={errors.replyOn?.message}>
          <Input id="replyOn" type="date" {...register("replyOn")} />
        </Field>
        <Field id="replyStatus" label="Reply" error={errors.replyStatus?.message} required>
          <Controller
            control={control}
            name="replyStatus"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="replyStatus" className="w-full">
                  <SelectValue placeholder="Select reply">
                    {(value: string | null) =>
                      value
                        ? DESIGN_REVISION_REPLY_STATUS_LABELS[value as keyof typeof DESIGN_REVISION_REPLY_STATUS_LABELS]
                        : "Select reply"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DESIGN_REVISION_REPLY_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {DESIGN_REVISION_REPLY_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <Field id="clientAskedFor" label="Client asked for" error={errors.clientAskedFor?.message}>
        <Input id="clientAskedFor" {...register("clientAskedFor")} />
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
