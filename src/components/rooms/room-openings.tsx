"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createOpening, deleteOpening } from "@/lib/actions/rooms";
import { openingSchema, OPENING_TYPES, OPENING_TYPE_LABELS, type OpeningInput } from "@/lib/validations/room";
import type { OpeningRow } from "@/lib/data/rooms";

export function RoomOpenings({
  roomId,
  projectId,
  openings,
}: {
  roomId: string;
  projectId: string;
  openings: OpeningRow[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<OpeningInput>({
    resolver: zodResolver(openingSchema),
    defaultValues: { openingType: "door", width: 3, height: 7, quantity: 1 },
  });

  async function submit(values: OpeningInput) {
    const result = await createOpening(roomId, projectId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    reset();
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(openingId: string) {
    const result = await deleteOpening(openingId, roomId, projectId);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {openings.length > 0 && (
        <ul className="flex flex-col gap-1">
          {openings.map((o) => (
            <li key={o.id} className="flex items-center justify-between rounded-md border px-2 py-1 text-xs">
              <span>
                {OPENING_TYPE_LABELS[o.opening_type]} · {o.quantity} × {o.width}×{o.height} ft
              </span>
              <button type="button" onClick={() => handleDelete(o.id)} aria-label="Remove opening">
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
            name="openingType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-28" size="sm">
                  <SelectValue>{(v: string | null) => OPENING_TYPE_LABELS[v as keyof typeof OPENING_TYPE_LABELS] ?? "Select"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {OPENING_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {OPENING_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Input className="w-20" type="number" step="0.01" placeholder="Width" {...register("width", { valueAsNumber: true })} />
          <Input className="w-20" type="number" step="0.01" placeholder="Height" {...register("height", { valueAsNumber: true })} />
          <Input className="w-16" type="number" placeholder="Qty" {...register("quantity", { valueAsNumber: true })} />
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
          Add opening
        </Button>
      )}
    </div>
  );
}
