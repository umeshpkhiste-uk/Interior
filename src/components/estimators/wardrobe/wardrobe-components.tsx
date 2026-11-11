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
import { addWardrobeComponent, removeWardrobeComponent } from "@/lib/actions/wardrobes";
import { formatINR } from "@/lib/calculations/shared";
import {
  wardrobeComponentSchema,
  WARDROBE_COMPONENT_TYPES,
  WARDROBE_COMPONENT_LABELS,
  type WardrobeComponentInput,
} from "@/lib/validations/wardrobe";
import type { WardrobeComponentRow } from "@/lib/data/wardrobes";

export function WardrobeComponents({
  wardrobeId,
  projectId,
  components,
}: {
  wardrobeId: string;
  projectId: string;
  components: WardrobeComponentRow[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<WardrobeComponentInput>({
    resolver: zodResolver(wardrobeComponentSchema),
    defaultValues: { componentName: "drawer", qty: 1, rate: 0 },
  });

  async function submit(values: WardrobeComponentInput) {
    const result = await addWardrobeComponent(wardrobeId, projectId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    reset();
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await removeWardrobeComponent(id, wardrobeId, projectId);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {components.length > 0 && (
        <ul className="flex flex-col gap-1">
          {components.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-md border px-2 py-1 text-xs">
              <span>
                {WARDROBE_COMPONENT_LABELS[c.component_name]} × {c.qty} @ {formatINR(Number(c.rate))} ={" "}
                {formatINR(Number(c.amount))}
              </span>
              <button type="button" onClick={() => handleDelete(c.id)} aria-label="Remove component">
                <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap items-end gap-2">
          <Controller
            control={control}
            name="componentName"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-36" size="sm">
                  <SelectValue>{(v: string | null) => WARDROBE_COMPONENT_LABELS[v as keyof typeof WARDROBE_COMPONENT_LABELS] ?? "Select"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {WARDROBE_COMPONENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {WARDROBE_COMPONENT_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Input type="number" placeholder="Qty" className="w-20" {...register("qty", { valueAsNumber: true })} />
          <Input type="number" placeholder="Rate" className="w-24" {...register("rate", { valueAsNumber: true })} />
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
          Add component
        </Button>
      )}
    </div>
  );
}
