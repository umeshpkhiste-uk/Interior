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
  CLIENT_APPROVAL_CHANNELS,
  CLIENT_APPROVAL_CHANNEL_LABELS,
  clientApprovalSchema,
  type ClientApprovalInput,
} from "@/lib/validations/client-approval";
import { ProjectSelectField } from "./project-select-field";
import type { ProjectOption } from "@/lib/data/projects";

export function ClientApprovalForm({
  projectOptions,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  projectOptions: ProjectOption[];
  defaultValues?: Partial<ClientApprovalInput>;
  onSubmit: (values: ClientApprovalInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientApprovalInput>({
    resolver: zodResolver(clientApprovalSchema),
    defaultValues: {
      projectId: "",
      approvalFor: "",
      roomArea: "",
      sentOn: new Date().toISOString().slice(0, 10),
      approvedOn: "",
      approvedBy: "",
      ...defaultValues,
    },
  });

  async function submit(values: ClientApprovalInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <ProjectSelectField control={control} name="projectId" projectOptions={projectOptions} error={errors.projectId?.message} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="approvalFor" label="Approval for" error={errors.approvalFor?.message} required>
          <Input id="approvalFor" placeholder="e.g. Layout, Kitchen design" {...register("approvalFor")} />
        </Field>
        <Field id="roomArea" label="Room / area" error={errors.roomArea?.message}>
          <Input id="roomArea" {...register("roomArea")} />
        </Field>
        <Field id="sentOn" label="Sent on" error={errors.sentOn?.message} required>
          <Input id="sentOn" type="date" {...register("sentOn")} />
        </Field>
        <Field id="approvedOn" label="Approved on" error={errors.approvedOn?.message}>
          <Input id="approvedOn" type="date" {...register("approvedOn")} />
        </Field>
        <Field id="approvedBy" label="Approved by" error={errors.approvedBy?.message}>
          <Input id="approvedBy" placeholder="e.g. Client, Client's spouse" {...register("approvedBy")} />
        </Field>
        <Field id="channel" label="How" error={errors.channel?.message}>
          <Controller
            control={control}
            name="channel"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="channel" className="w-full">
                  <SelectValue placeholder="Select how">
                    {(value: string | null) =>
                      value
                        ? CLIENT_APPROVAL_CHANNEL_LABELS[value as keyof typeof CLIENT_APPROVAL_CHANNEL_LABELS]
                        : "Select how"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_APPROVAL_CHANNELS.map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {CLIENT_APPROVAL_CHANNEL_LABELS[channel]}
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
