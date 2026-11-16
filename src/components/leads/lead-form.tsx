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
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  LEAD_STAGES,
  LEAD_STAGE_LABELS,
  leadSchema,
  type LeadInput,
} from "@/lib/validations/lead";

export function LeadForm({
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  defaultValues?: Partial<LeadInput>;
  onSubmit: (values: LeadInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      enquiryDate: new Date().toISOString().slice(0, 10),
      clientName: "",
      phone: "",
      area: "",
      source: "other",
      propertyType: "",
      stage: "new",
      nextFollowupDate: "",
      custom1: "",
      custom2: "",
      notes: "",
      ...defaultValues,
    },
  });

  async function submit(values: LeadInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="clientName" label="Client name" error={errors.clientName?.message} required>
          <Input id="clientName" {...register("clientName")} />
        </Field>
        <Field id="enquiryDate" label="Enquiry date" error={errors.enquiryDate?.message} required>
          <Input id="enquiryDate" type="date" {...register("enquiryDate")} />
        </Field>
        <Field id="phone" label="Phone" error={errors.phone?.message}>
          <Input id="phone" {...register("phone")} />
        </Field>
        <Field id="area" label="Area" error={errors.area?.message}>
          <Input id="area" {...register("area")} />
        </Field>
        <Field id="source" label="Source" error={errors.source?.message} required>
          <Controller
            control={control}
            name="source"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="source" className="w-full">
                  <SelectValue placeholder="Select source">
                    {(value: string | null) =>
                      value ? LEAD_SOURCE_LABELS[value as keyof typeof LEAD_SOURCE_LABELS] : "Select source"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {LEAD_SOURCE_LABELS[source]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="propertyType" label="Property" error={errors.propertyType?.message}>
          <Input id="propertyType" placeholder="e.g. 3 BHK, Villa, Office" {...register("propertyType")} />
        </Field>
        <Field id="budget" label="Budget (₹)" error={errors.budget?.message}>
          <Input id="budget" type="number" min={0} {...register("budget", { valueAsNumber: true })} />
        </Field>
        <Field id="stage" label="Stage" error={errors.stage?.message} required>
          <Controller
            control={control}
            name="stage"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="stage" className="w-full">
                  <SelectValue placeholder="Select stage">
                    {(value: string | null) =>
                      value ? LEAD_STAGE_LABELS[value as keyof typeof LEAD_STAGE_LABELS] : "Select stage"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {LEAD_STAGE_LABELS[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="nextFollowupDate" label="Next follow-up" error={errors.nextFollowupDate?.message}>
          <Input id="nextFollowupDate" type="date" {...register("nextFollowupDate")} />
        </Field>
        <Field id="custom1" label="Custom 1" error={errors.custom1?.message}>
          <Input id="custom1" placeholder="e.g. Referred by" {...register("custom1")} />
        </Field>
        <Field id="custom2" label="Custom 2" error={errors.custom2?.message}>
          <Input id="custom2" placeholder="e.g. Style" {...register("custom2")} />
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
