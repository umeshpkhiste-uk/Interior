"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/shared/field";
import { createMaterialRate } from "@/lib/actions/rates";
import { materialRateSchema, type MaterialRateInput } from "@/lib/validations/rates";
import type { MaterialOption } from "@/lib/data/rates";
import type { SupplierRow } from "@/lib/data/materials";

export function RateFormDialog({ materialsWithoutRate, suppliers }: { materialsWithoutRate: MaterialOption[]; suppliers: SupplierRow[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<MaterialRateInput>({
    resolver: zodResolver(materialRateSchema),
    defaultValues: {
      materialId: "", supplierId: "", currentRate: 0, effectiveDate: "",
      plannedIncreasePct: 0, roundStep: 5, monthlyVolume: 0,
    },
  });

  async function submit(values: MaterialRateInput) {
    const result = await createMaterialRate(values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" disabled={materialsWithoutRate.length === 0}>
            <Plus className="size-4" />
            Add Rate
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a material rate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <Field id="materialId" label="Material" error={errors.materialId?.message} required>
            <Controller
              control={control}
              name="materialId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="materialId" className="w-full">
                    <SelectValue>{() => materialsWithoutRate.find((m) => m.id === field.value)?.name ?? "Select material"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {materialsWithoutRate.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field id="supplierId" label="Supplier">
            <Controller
              control={control}
              name="supplierId"
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger id="supplierId" className="w-full">
                    <SelectValue>{() => suppliers.find((s) => s.id === field.value)?.name ?? "No supplier"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No supplier</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field id="currentRate" label="Current rate (₹)" error={errors.currentRate?.message}>
            <Input id="currentRate" type="number" step="0.01" {...register("currentRate", { valueAsNumber: true })} />
          </Field>
          <Field id="plannedIncreasePct" label="Planned increase (%)" error={errors.plannedIncreasePct?.message}>
            <Input id="plannedIncreasePct" type="number" step="0.01" {...register("plannedIncreasePct", { valueAsNumber: true })} />
          </Field>
          <Field id="roundStep" label="Round to nearest (₹)" error={errors.roundStep?.message}>
            <Input id="roundStep" type="number" step="0.01" {...register("roundStep", { valueAsNumber: true })} />
          </Field>
          <Field id="monthlyVolume" label="Expected monthly volume" error={errors.monthlyVolume?.message}>
            <Input id="monthlyVolume" type="number" step="0.01" {...register("monthlyVolume", { valueAsNumber: true })} />
          </Field>
          <Field id="marketLow" label="Market low (₹)" error={errors.marketLow?.message}>
            <Input id="marketLow" type="number" step="0.01" {...register("marketLow", { valueAsNumber: true })} />
          </Field>
          <Field id="marketHigh" label="Market high (₹)" error={errors.marketHigh?.message}>
            <Input id="marketHigh" type="number" step="0.01" {...register("marketHigh", { valueAsNumber: true })} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add rate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
