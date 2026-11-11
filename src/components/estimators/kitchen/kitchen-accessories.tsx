"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addKitchenAccessory, removeKitchenAccessory } from "@/lib/actions/kitchen";
import { formatINR } from "@/lib/calculations/shared";
import { kitchenAccessorySchema, type KitchenAccessoryInput } from "@/lib/validations/kitchen";
import type { KitchenAccessoryRow } from "@/lib/data/kitchen";

export function KitchenAccessories({
  kitchenEstimationId,
  projectId,
  accessories,
}: {
  kitchenEstimationId: string;
  projectId: string;
  accessories: KitchenAccessoryRow[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<KitchenAccessoryInput>({
    resolver: zodResolver(kitchenAccessorySchema),
    defaultValues: { name: "", qty: 1, rate: 0 },
  });

  async function submit(values: KitchenAccessoryInput) {
    const result = await addKitchenAccessory(kitchenEstimationId, projectId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    reset();
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await removeKitchenAccessory(id, kitchenEstimationId, projectId);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hardware / accessory</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {accessories.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{a.name}</TableCell>
              <TableCell>{a.qty}</TableCell>
              <TableCell>{formatINR(Number(a.rate))}</TableCell>
              <TableCell>{formatINR(Number(a.amount))}</TableCell>
              <TableCell className="text-right">
                <button type="button" onClick={() => handleDelete(a.id)} aria-label="Remove accessory">
                  <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </TableCell>
            </TableRow>
          ))}
          {accessories.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No hardware/accessories added yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {adding ? (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap items-end gap-2">
          <Input placeholder="Name (e.g. Soft-close hinge)" className="w-56" {...register("name")} />
          <Input type="number" placeholder="Qty" className="w-20" {...register("qty", { valueAsNumber: true })} />
          <Input type="number" placeholder="Rate" className="w-28" {...register("rate", { valueAsNumber: true })} />
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
          Add accessory
        </Button>
      )}
    </div>
  );
}
