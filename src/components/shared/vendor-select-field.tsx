"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/field";
import type { VendorOption } from "@/lib/data/vendors";

export function VendorSelectField<T extends FieldValues>({
  control,
  name,
  vendorOptions,
  error,
}: {
  control: Control<T>;
  name: Path<T>;
  vendorOptions: VendorOption[];
  error?: string;
}) {
  return (
    <Field id={name} label="Vendor" error={error} required>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id={name} className="w-full">
              <SelectValue placeholder="Select a vendor">
                {(value: string | null) => {
                  const option = vendorOptions.find((o) => o.id === value);
                  return option ? `${option.vendorCode ?? ""} — ${option.name}`.trim() : "Select a vendor";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {vendorOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.vendorCode ? `${option.vendorCode} — ` : ""}
                  {option.name}
                  {option.category ? ` (${option.category})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  );
}
