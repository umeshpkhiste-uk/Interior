"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/field";
import { updateQuotationSettings } from "@/lib/actions/quotations";
import {
  quotationSettingsSchema,
  DISCOUNT_TYPES,
  type QuotationSettingsInput,
} from "@/lib/validations/quotation";
import type { QuotationRow } from "@/lib/data/quotations";

const DISCOUNT_TYPE_LABELS: Record<(typeof DISCOUNT_TYPES)[number], string> = {
  percent: "Percent",
  fixed: "Fixed amount",
};

export function QuotationSettingsForm({ quotation, projectId }: { quotation: QuotationRow; projectId: string }) {
  const router = useRouter();
  const disabled = quotation.status !== "draft";
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<QuotationSettingsInput>({
    resolver: zodResolver(quotationSettingsSchema),
    defaultValues: {
      validityDate: quotation.validity_date ?? "",
      discountType: quotation.discount_type,
      discountValue: Number(quotation.discount_value),
      gstPct: Number(quotation.gst_pct) * 100,
    },
  });

  async function submit(values: QuotationSettingsInput) {
    const result = await updateQuotationSettings(quotation.id, projectId, values);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Quotation settings saved");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-wrap items-end gap-3">
      <Field id="validityDate" label="Valid until">
        <Input id="validityDate" type="date" className="w-40" disabled={disabled} {...register("validityDate")} />
      </Field>
      <Field id="discountType" label="Discount type">
        <Controller
          control={control}
          name="discountType"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
              <SelectTrigger id="discountType" className="w-36">
                <SelectValue>{(v: string | null) => DISCOUNT_TYPE_LABELS[v as keyof typeof DISCOUNT_TYPE_LABELS] ?? "Select"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {DISCOUNT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {DISCOUNT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <Field id="discountValue" label="Discount value" error={errors.discountValue?.message}>
        <Input id="discountValue" type="number" step="0.01" className="w-32" disabled={disabled} {...register("discountValue", { valueAsNumber: true })} />
      </Field>
      <Field id="gstPct" label="GST (%)" error={errors.gstPct?.message}>
        <Input id="gstPct" type="number" step="0.01" className="w-28" disabled={disabled} {...register("gstPct", { valueAsNumber: true })} />
      </Field>
      {!disabled && (
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      )}
    </form>
  );
}
