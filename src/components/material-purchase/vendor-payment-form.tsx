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
  VENDOR_PAYMENT_MODES,
  VENDOR_PAYMENT_MODE_LABELS,
  vendorPaymentSchema,
  type VendorPaymentInput,
} from "@/lib/validations/vendor-payment";
import { VendorSelectField } from "@/components/shared/vendor-select-field";
import type { VendorOption } from "@/lib/data/vendors";

export function VendorPaymentForm({
  vendorOptions,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  vendorOptions: VendorOption[];
  defaultValues?: Partial<VendorPaymentInput>;
  onSubmit: (values: VendorPaymentInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VendorPaymentInput>({
    resolver: zodResolver(vendorPaymentSchema),
    defaultValues: {
      vendorId: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      mode: "bank_transfer",
      reference: "",
      ...defaultValues,
    },
  });

  async function submit(values: VendorPaymentInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <VendorSelectField control={control} name="vendorId" vendorOptions={vendorOptions} error={errors.vendorId?.message} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="paymentDate" label="Date" error={errors.paymentDate?.message} required>
          <Input id="paymentDate" type="date" {...register("paymentDate")} />
        </Field>
        <Field id="amount" label="Amount (₹)" error={errors.amount?.message} required>
          <Input id="amount" type="number" min={0} {...register("amount", { valueAsNumber: true })} />
        </Field>
        <Field id="mode" label="Mode" error={errors.mode?.message} required>
          <Controller
            control={control}
            name="mode"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="mode" className="w-full">
                  <SelectValue placeholder="Select mode">
                    {(value: string | null) =>
                      value ? VENDOR_PAYMENT_MODE_LABELS[value as keyof typeof VENDOR_PAYMENT_MODE_LABELS] : "Select mode"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_PAYMENT_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {VENDOR_PAYMENT_MODE_LABELS[mode]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="reference" label="Reference" error={errors.reference?.message}>
          <Input id="reference" placeholder="e.g. Ref 7101" {...register("reference")} />
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
