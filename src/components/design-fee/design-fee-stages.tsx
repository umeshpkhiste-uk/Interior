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
import { addDesignFeeStage, deleteDesignFeeStage } from "@/lib/actions/design-fee";
import { formatINR } from "@/lib/calculations/shared";
import { paymentStagesSumToFull } from "@/lib/calculations/quotation";
import { designFeeStageSchema, type DesignFeeStageInput } from "@/lib/validations/design-fee";
import type { DesignFeeStageRow } from "@/lib/data/design-fee";

export function DesignFeeStages({ designFeeId, projectId, stages }: { designFeeId: string; projectId: string; stages: DesignFeeStageRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<DesignFeeStageInput>({
    resolver: zodResolver(designFeeStageSchema),
    defaultValues: { stageName: "", stagePct: 0 },
  });
  const sumsToFull = paymentStagesSumToFull(stages.map((s) => ({ stagePct: Number(s.stage_pct ?? 0) })));

  async function submit(values: DesignFeeStageInput) {
    const result = await addDesignFeeStage(designFeeId, projectId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    reset();
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deleteDesignFeeStage(id, projectId);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Milestone</TableHead>
            <TableHead>%</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {stages.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.stage_name}</TableCell>
              <TableCell>{(Number(s.stage_pct ?? 0) * 100).toFixed(1)}%</TableCell>
              <TableCell className="font-medium">{formatINR(Number(s.stage_amount))}</TableCell>
              <TableCell className="text-right">
                <button type="button" onClick={() => handleDelete(s.id)} aria-label="Remove milestone">
                  <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </TableCell>
            </TableRow>
          ))}
          {stages.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No billing milestones yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {stages.length > 0 && !sumsToFull && <p className="text-xs text-amber-600">Milestone percentages don&apos;t add up to 100% yet.</p>}

      {adding ? (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap items-end gap-2">
          <Input placeholder="Milestone (e.g. Concept approval)" className="w-56" {...register("stageName")} />
          <Input type="number" step="0.01" placeholder="%" className="w-24" {...register("stagePct", { valueAsNumber: true })} />
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
          Add milestone
        </Button>
      )}
    </div>
  );
}
