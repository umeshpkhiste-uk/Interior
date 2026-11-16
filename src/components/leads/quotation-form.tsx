"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import {
  LEAD_QUOTATION_STATUSES,
  LEAD_QUOTATION_STATUS_LABELS,
  leadQuotationSchema,
  type LeadQuotationInput,
} from "@/lib/validations/lead-quotation";
import type { LeadOption } from "@/lib/data/leads";

export function QuotationForm({
  leadOptions,
  defaultLeadId,
  onSubmit,
  onCancel,
}: {
  leadOptions: LeadOption[];
  defaultLeadId?: string;
  onSubmit: (values: LeadQuotationInput) => Promise<{ error: string | null }>;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadQuotationInput>({
    resolver: zodResolver(leadQuotationSchema),
    defaultValues: {
      leadId: defaultLeadId ?? "",
      quoteDate: new Date().toISOString().slice(0, 10),
      discountPct: 0,
      status: "sent",
    },
  });

  async function submit(values: LeadQuotationInput) {
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
        <Field id="quoteDate" label="Date" error={errors.quoteDate?.message} required>
          <Input id="quoteDate" type="date" {...register("quoteDate")} />
        </Field>
        <Field id="status" label="Status" error={errors.status?.message} required>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select status">
                    {(value: string | null) =>
                      value
                        ? LEAD_QUOTATION_STATUS_LABELS[value as keyof typeof LEAD_QUOTATION_STATUS_LABELS]
                        : "Select status"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LEAD_QUOTATION_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {LEAD_QUOTATION_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="quotedAmount" label="Quoted (₹)" error={errors.quotedAmount?.message} required>
          <Input
            id="quotedAmount"
            type="number"
            min={0}
            {...register("quotedAmount", { valueAsNumber: true })}
          />
        </Field>
        <Field id="discountPct" label="Discount (%)" error={errors.discountPct?.message}>
          <Input
            id="discountPct"
            type="number"
            min={0}
            max={100}
            step="0.1"
            {...register("discountPct", { valueAsNumber: true })}
          />
        </Field>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Add quotation"}
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
