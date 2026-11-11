"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/shared/field";
import { saveDesignFee } from "@/lib/actions/design-fee";
import { designFeeSchema, DESIGN_FEE_BASES, DESIGN_FEE_BASIS_LABELS, type DesignFeeInput } from "@/lib/validations/design-fee";
import type { DesignFeeRow } from "@/lib/data/design-fee";

export function DesignFeeForm({ projectId, designFee }: { projectId: string; designFee: DesignFeeRow | null }) {
  const router = useRouter();
  const { register, control, watch, handleSubmit, formState: { errors, isSubmitting } } = useForm<DesignFeeInput>({
    resolver: zodResolver(designFeeSchema),
    defaultValues: designFee
      ? {
          basis: designFee.basis,
          feePct: Number(designFee.fee_pct) * 100,
          feePerSqft: Number(designFee.fee_per_sqft),
          fixedFee: Number(designFee.fixed_fee),
          includedVisits: designFee.included_visits,
          additionalVisits: designFee.additional_visits,
          additionalVisitRate: Number(designFee.additional_visit_rate),
          gstPct: Number(designFee.gst_pct) * 100,
        }
      : { basis: "percent", feePct: 8, feePerSqft: 150, fixedFee: 150000, includedVisits: 10, additionalVisits: 0, additionalVisitRate: 2000, gstPct: 18 },
  });

  const basis = watch("basis");

  async function submit(values: DesignFeeInput) {
    const result = await saveDesignFee(projectId, values);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Design fee saved");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field id="basis" label="Fee basis">
          <Controller
            control={control}
            name="basis"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="basis" className="w-full">
                  <SelectValue>{(v: string | null) => DESIGN_FEE_BASIS_LABELS[v as keyof typeof DESIGN_FEE_BASIS_LABELS] ?? "Select"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DESIGN_FEE_BASES.map((b) => (
                    <SelectItem key={b} value={b}>
                      {DESIGN_FEE_BASIS_LABELS[b]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        {basis === "percent" && (
          <Field id="feePct" label="Fee (% of project value)" error={errors.feePct?.message}>
            <Input id="feePct" type="number" step="0.01" {...register("feePct", { valueAsNumber: true })} />
          </Field>
        )}
        {basis === "per_sqft" && (
          <Field id="feePerSqft" label="Fee (₹/sqft)" error={errors.feePerSqft?.message}>
            <Input id="feePerSqft" type="number" step="0.01" {...register("feePerSqft", { valueAsNumber: true })} />
          </Field>
        )}
        {basis === "fixed" && (
          <Field id="fixedFee" label="Fixed fee (₹)" error={errors.fixedFee?.message}>
            <Input id="fixedFee" type="number" step="0.01" {...register("fixedFee", { valueAsNumber: true })} />
          </Field>
        )}
        <Field id="includedVisits" label="Included site visits" error={errors.includedVisits?.message}>
          <Input id="includedVisits" type="number" {...register("includedVisits", { valueAsNumber: true })} />
        </Field>
        <Field id="additionalVisits" label="Additional visits (used)" error={errors.additionalVisits?.message}>
          <Input id="additionalVisits" type="number" {...register("additionalVisits", { valueAsNumber: true })} />
        </Field>
        <Field id="additionalVisitRate" label="Rate per additional visit (₹)" error={errors.additionalVisitRate?.message}>
          <Input id="additionalVisitRate" type="number" step="0.01" {...register("additionalVisitRate", { valueAsNumber: true })} />
        </Field>
        <Field id="gstPct" label="GST (%)" error={errors.gstPct?.message}>
          <Input id="gstPct" type="number" step="0.01" {...register("gstPct", { valueAsNumber: true })} />
        </Field>
      </div>
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save design fee"}
        </Button>
      </div>
    </form>
  );
}
