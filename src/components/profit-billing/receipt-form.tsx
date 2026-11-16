"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { ProjectSelectField } from "@/components/shared/project-select-field";
import { paymentSchema, PAYMENT_DIRECTION_LABELS, type PaymentInput } from "@/lib/validations/expenses";
import type { ProjectOption } from "@/lib/data/projects";
import type { InvoiceOption } from "@/lib/data/invoices";

const RECEIPT_DIRECTIONS = ["client_advance", "client_payment"] as const;
const RECEIPT_MODES = ["Cash", "UPI", "Bank transfer", "Cheque", "Other"];

const receiptFormSchema = paymentSchema.extend({ projectId: z.string().uuid("Select a project") });
export type ReceiptFormInput = PaymentInput & { projectId: string };

export function ReceiptForm({
  projectOptions,
  invoiceOptions,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  projectOptions: ProjectOption[];
  invoiceOptions: InvoiceOption[];
  defaultValues?: Partial<ReceiptFormInput>;
  onSubmit: (values: ReceiptFormInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReceiptFormInput>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      projectId: "",
      direction: "client_payment",
      amount: 0,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "",
      referenceNote: "",
      invoiceId: "",
      ...defaultValues,
    },
  });

  async function submit(values: ReceiptFormInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <ProjectSelectField control={control} name="projectId" projectOptions={projectOptions} error={errors.projectId?.message} />

      <Field id="invoiceId" label="Against invoice" error={errors.invoiceId?.message}>
        <Controller
          control={control}
          name="invoiceId"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger id="invoiceId" className="w-full">
                <SelectValue placeholder="Not against an invoice">
                  {(value: string | null) => {
                    const option = invoiceOptions.find((o) => o.id === value);
                    return option ? option.invoiceNumber : "Not against an invoice";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {invoiceOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.invoiceNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="direction" label="Type" error={errors.direction?.message} required>
          <Controller
            control={control}
            name="direction"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="direction" className="w-full">
                  <SelectValue placeholder="Select type">
                    {(value: string | null) => (value ? PAYMENT_DIRECTION_LABELS[value as keyof typeof PAYMENT_DIRECTION_LABELS] : "Select type")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {RECEIPT_DIRECTIONS.map((direction) => (
                    <SelectItem key={direction} value={direction}>
                      {PAYMENT_DIRECTION_LABELS[direction]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="amount" label="Amount (₹)" error={errors.amount?.message} required>
          <Input id="amount" type="number" min={0} {...register("amount", { valueAsNumber: true })} />
        </Field>
        <Field id="paymentDate" label="Date" error={errors.paymentDate?.message} required>
          <Input id="paymentDate" type="date" {...register("paymentDate")} />
        </Field>
        <Field id="method" label="Mode" error={errors.method?.message}>
          <Controller
            control={control}
            name="method"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="method" className="w-full">
                  <SelectValue placeholder="Select mode">{(value: string | null) => value || "Select mode"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {RECEIPT_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="referenceNote" label="Reference" error={errors.referenceNote?.message}>
          <Input id="referenceNote" placeholder="e.g. Ref 5200" {...register("referenceNote")} />
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
