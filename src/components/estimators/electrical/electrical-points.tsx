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
import { addElectricalPoint, removeElectricalPoint } from "@/lib/actions/electrical";
import { formatINR } from "@/lib/calculations/shared";
import {
  electricalPointSchema,
  ELECTRICAL_POINT_TYPES,
  ELECTRICAL_POINT_TYPE_LABELS,
  type ElectricalPointInput,
} from "@/lib/validations/electrical";
import type { ElectricalPointRow } from "@/lib/data/electrical";

export function ElectricalPoints({
  roomId,
  projectId,
  points,
}: {
  roomId: string;
  projectId: string;
  points: ElectricalPointRow[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<ElectricalPointInput>({
    resolver: zodResolver(electricalPointSchema),
    defaultValues: { pointType: "light", qty: 1, allInRate: 600 },
  });

  const roomTotal = points.reduce((sum, p) => sum + Number(p.amount), 0);

  async function submit(values: ElectricalPointInput) {
    const result = await addElectricalPoint(roomId, projectId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    reset();
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await removeElectricalPoint(id, projectId);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {points.length > 0 && (
        <ul className="flex flex-col gap-1">
          {points.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-md border px-2 py-1 text-xs">
              <span>
                {ELECTRICAL_POINT_TYPE_LABELS[p.point_type]} × {p.qty} @ {formatINR(Number(p.all_in_rate))} ={" "}
                {formatINR(Number(p.amount))}
              </span>
              <button type="button" onClick={() => handleDelete(p.id)} aria-label="Remove point">
                <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </li>
          ))}
          <li className="flex items-center justify-end px-2 text-xs font-medium">
            Room total: {formatINR(roomTotal)}
          </li>
        </ul>
      )}

      {adding ? (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap items-end gap-2">
          <Controller
            control={control}
            name="pointType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-44" size="sm">
                  <SelectValue>{(v: string | null) => ELECTRICAL_POINT_TYPE_LABELS[v as keyof typeof ELECTRICAL_POINT_TYPE_LABELS] ?? "Select"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ELECTRICAL_POINT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ELECTRICAL_POINT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Input type="number" placeholder="Qty" className="w-20" {...register("qty", { valueAsNumber: true })} />
          <Input type="number" placeholder="All-in rate" className="w-28" {...register("allInRate", { valueAsNumber: true })} />
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
          Add point
        </Button>
      )}
    </div>
  );
}
