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
  HANDOVER_CHECK_RESULTS,
  HANDOVER_CHECK_RESULT_LABELS,
  handoverCheckSchema,
  type HandoverCheckInput,
} from "@/lib/validations/handover-check";
import { ProjectSelectField } from "./project-select-field";
import type { ProjectOption } from "@/lib/data/projects";

export function HandoverCheckForm({
  projectOptions,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  projectOptions: ProjectOption[];
  defaultValues?: Partial<HandoverCheckInput>;
  onSubmit: (values: HandoverCheckInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HandoverCheckInput>({
    resolver: zodResolver(handoverCheckSchema),
    defaultValues: {
      projectId: "",
      roomArea: "",
      checkItem: "",
      checkedBy: "",
      checkedOn: "",
      ...defaultValues,
    },
  });

  async function submit(values: HandoverCheckInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <ProjectSelectField control={control} name="projectId" projectOptions={projectOptions} error={errors.projectId?.message} />

      <Field id="checkItem" label="Check" error={errors.checkItem?.message} required>
        <Input id="checkItem" placeholder="e.g. Shutters aligned and soft-close working" {...register("checkItem")} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="roomArea" label="Room / area" error={errors.roomArea?.message}>
          <Input id="roomArea" {...register("roomArea")} />
        </Field>
        <Field id="checkedBy" label="Checked by" error={errors.checkedBy?.message}>
          <Input id="checkedBy" placeholder="e.g. Site supervisor, Designer" {...register("checkedBy")} />
        </Field>
        <Field id="checkedOn" label="Checked on" error={errors.checkedOn?.message}>
          <Input id="checkedOn" type="date" {...register("checkedOn")} />
        </Field>
        <Field id="result" label="Result" error={errors.result?.message}>
          <Controller
            control={control}
            name="result"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="result" className="w-full">
                  <SelectValue placeholder="Not checked">
                    {(value: string | null) =>
                      value ? HANDOVER_CHECK_RESULT_LABELS[value as keyof typeof HANDOVER_CHECK_RESULT_LABELS] : "Not checked"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {HANDOVER_CHECK_RESULTS.map((result) => (
                    <SelectItem key={result} value={result}>
                      {HANDOVER_CHECK_RESULT_LABELS[result]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
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
