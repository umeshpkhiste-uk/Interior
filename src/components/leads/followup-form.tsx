"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import {
  LEAD_FOLLOWUP_CHANNELS,
  LEAD_FOLLOWUP_CHANNEL_LABELS,
  leadFollowupSchema,
  type LeadFollowupInput,
} from "@/lib/validations/lead-followup";
import type { LeadOption } from "@/lib/data/leads";

export function FollowupForm({
  leadOptions,
  defaultLeadId,
  onSubmit,
  onCancel,
}: {
  leadOptions: LeadOption[];
  defaultLeadId?: string;
  onSubmit: (values: LeadFollowupInput) => Promise<{ error: string | null }>;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFollowupInput>({
    resolver: zodResolver(leadFollowupSchema),
    defaultValues: {
      leadId: defaultLeadId ?? "",
      followupDate: new Date().toISOString().slice(0, 10),
      channel: "call",
      handledBy: "",
      outcome: "",
    },
  });

  async function submit(values: LeadFollowupInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Field id="leadId" label="Lead" error={errors.leadId?.message} required>
        <Controller
          control={control}
          name="leadId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="leadId" className="w-full">
                <SelectValue placeholder="Select a lead">
                  {(value: string | null) => {
                    const option = leadOptions.find((o) => o.id === value);
                    return option ? `${option.leadCode} — ${option.clientName}` : "Select a lead";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {leadOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.leadCode} — {option.clientName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="followupDate" label="Date" error={errors.followupDate?.message} required>
          <Input id="followupDate" type="date" {...register("followupDate")} />
        </Field>
        <Field id="channel" label="How" error={errors.channel?.message} required>
          <Controller
            control={control}
            name="channel"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="channel" className="w-full">
                  <SelectValue placeholder="Select channel">
                    {(value: string | null) =>
                      value
                        ? LEAD_FOLLOWUP_CHANNEL_LABELS[value as keyof typeof LEAD_FOLLOWUP_CHANNEL_LABELS]
                        : "Select channel"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LEAD_FOLLOWUP_CHANNELS.map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {LEAD_FOLLOWUP_CHANNEL_LABELS[channel]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="handledBy" label="By" error={errors.handledBy?.message}>
          <Input id="handledBy" placeholder="e.g. Designer, Studio owner" {...register("handledBy")} />
        </Field>
      </div>

      <Field id="outcome" label="Outcome" error={errors.outcome?.message}>
        <Textarea id="outcome" rows={2} {...register("outcome")} />
      </Field>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Log follow-up"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
