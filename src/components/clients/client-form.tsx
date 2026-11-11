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
import { clientSchema, PROPERTY_TYPES, type ClientInput } from "@/lib/validations/client";

const PROPERTY_TYPE_LABELS: Record<(typeof PROPERTY_TYPES)[number], string> = {
  apartment: "Apartment",
  villa: "Villa",
  independent_house: "Independent House",
  office: "Office",
  commercial: "Commercial",
};

export function ClientForm({
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  defaultValues?: Partial<ClientInput>;
  onSubmit: (values: ClientInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      mobile: "",
      email: "",
      alternateContact: "",
      address: "",
      city: "",
      state: "",
      pinCode: "",
      notes: "",
      ...defaultValues,
    },
  });

  async function submit(values: ClientInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="name" label="Client name" error={errors.name?.message} required>
          <Input id="name" {...register("name")} />
        </Field>
        <Field id="propertyType" label="Property type" error={errors.propertyType?.message}>
          <Controller
            control={control}
            name="propertyType"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="propertyType" className="w-full">
                  <SelectValue placeholder="Select type">
                    {(value: string | null) => (value ? PROPERTY_TYPE_LABELS[value as keyof typeof PROPERTY_TYPE_LABELS] : "Select type")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {PROPERTY_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="mobile" label="Mobile" error={errors.mobile?.message}>
          <Input id="mobile" {...register("mobile")} />
        </Field>
        <Field id="email" label="Email" error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} />
        </Field>
        <Field id="alternateContact" label="Alternate contact" error={errors.alternateContact?.message}>
          <Input id="alternateContact" {...register("alternateContact")} />
        </Field>
        <Field id="city" label="City" error={errors.city?.message}>
          <Input id="city" {...register("city")} />
        </Field>
        <Field id="state" label="State" error={errors.state?.message}>
          <Input id="state" {...register("state")} />
        </Field>
        <Field id="pinCode" label="PIN code" error={errors.pinCode?.message}>
          <Input id="pinCode" {...register("pinCode")} />
        </Field>
      </div>

      <Field id="address" label="Address" error={errors.address?.message}>
        <Textarea id="address" rows={2} {...register("address")} />
      </Field>
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
