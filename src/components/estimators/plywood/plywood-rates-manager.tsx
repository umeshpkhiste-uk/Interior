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
import { upsertPlywoodRate, deletePlywoodRate } from "@/lib/actions/plywood";
import { formatINR } from "@/lib/calculations/shared";
import { plywoodRateSchema, type PlywoodRateInput } from "@/lib/validations/plywood";
import type { PlywoodRateRow } from "@/lib/data/plywood";

export function PlywoodRatesManager({ rates }: { rates: PlywoodRateRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<PlywoodRateInput>({
    resolver: zodResolver(plywoodRateSchema),
    defaultValues: { boardGrade: "", ratePerSheet: 0, sheetLength: 8, sheetWidth: 4 },
  });

  async function submit(values: PlywoodRateInput) {
    const result = await upsertPlywoodRate(values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    reset();
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deletePlywoodRate(id);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Board grade</TableHead>
            <TableHead>Rate / sheet</TableHead>
            <TableHead>Sheet size</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rates.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.board_grade}</TableCell>
              <TableCell>{formatINR(Number(r.rate_per_sheet))}</TableCell>
              <TableCell>
                {r.sheet_length} × {r.sheet_width} ft
              </TableCell>
              <TableCell className="text-right">
                <button type="button" onClick={() => handleDelete(r.id)} aria-label="Remove rate">
                  <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </TableCell>
            </TableRow>
          ))}
          {rates.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No board grade rates yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {adding ? (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap items-end gap-2">
          <Input placeholder="Board grade (e.g. 18mm BWR Ply)" className="w-56" {...register("boardGrade")} />
          <Input type="number" placeholder="Rate/sheet" className="w-28" {...register("ratePerSheet", { valueAsNumber: true })} />
          <Input type="number" step="0.01" placeholder="Sheet length" className="w-28" {...register("sheetLength", { valueAsNumber: true })} />
          <Input type="number" step="0.01" placeholder="Sheet width" className="w-28" {...register("sheetWidth", { valueAsNumber: true })} />
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
          Add board grade
        </Button>
      )}
    </div>
  );
}
