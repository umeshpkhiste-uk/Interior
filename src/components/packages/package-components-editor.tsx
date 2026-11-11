"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { savePackageComponent, deletePackageComponent } from "@/lib/actions/packages";
import { formatINR } from "@/lib/calculations/shared";
import {
  packageComponentSchema,
  PACKAGE_COMPONENT_TYPES,
  PACKAGE_COMPONENT_LABELS,
  type PackageComponentInput,
} from "@/lib/validations/packages";
import type { PackageComponentRow } from "@/lib/data/packages";

export function PackageComponentsEditor({
  packageId,
  projectId,
  components,
}: {
  packageId: string;
  projectId: string;
  components: PackageComponentRow[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<PackageComponentInput>({
    resolver: zodResolver(packageComponentSchema),
    defaultValues: { component: "kitchen", ratePerSqft: 0, specText: "", brandOptions: "" },
  });

  async function submit(values: PackageComponentInput) {
    const result = await savePackageComponent(packageId, projectId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    reset();
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deletePackageComponent(id, projectId);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {components.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-md border px-2 py-1.5 text-xs">
          <span className="font-medium">{PACKAGE_COMPONENT_LABELS[c.component]}</span>
          <span>{formatINR(Number(c.rate_per_sqft))}/sqft</span>
          <button type="button" onClick={() => handleDelete(c.id)} aria-label="Remove component">
            <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}

      {adding ? (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap items-end gap-2">
          <Controller
            control={control}
            name="component"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-32" size="sm">
                  <SelectValue>{(v: string | null) => PACKAGE_COMPONENT_LABELS[v as keyof typeof PACKAGE_COMPONENT_LABELS] ?? "Select"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PACKAGE_COMPONENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {PACKAGE_COMPONENT_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Input type="number" step="0.01" placeholder="Rate/sqft" className="w-24" {...register("ratePerSqft", { valueAsNumber: true })} />
          <Button type="submit" size="sm" disabled={isSubmitting}>
            Add
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </form>
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="size-3.5" />
          Add component rate
        </Button>
      )}
    </div>
  );
}
