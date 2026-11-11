"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { saveCutListRow, deleteCutListRow } from "@/lib/actions/plywood";
import { panelCutRowSchema, type PanelCutRowInput } from "@/lib/validations/plywood";
import type { PanelCutRow, PlywoodRateRow } from "@/lib/data/plywood";

export function CutListTable({
  projectId,
  rows,
  rates,
}: {
  projectId: string;
  rows: PanelCutRow[];
  rates: PlywoodRateRow[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<PanelCutRowInput>({
    resolver: zodResolver(panelCutRowSchema),
    defaultValues: {
      panelLength: 8, panelWidth: 4, qty: 1, boardGrade: rates[0]?.board_grade ?? "",
      laminateFaces: 0, hasEdgeBand: false, wastagePct: 5,
    },
  });

  async function submit(values: PanelCutRowInput) {
    const result = await saveCutListRow(projectId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    reset();
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deleteCutListRow(id, projectId);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Board grade</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>L × W (ft)</TableHead>
            <TableHead>Laminate faces</TableHead>
            <TableHead>Edge band</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.board_grade}</TableCell>
              <TableCell>{r.qty}</TableCell>
              <TableCell>
                {r.panel_length} × {r.panel_width}
              </TableCell>
              <TableCell>{r.laminate_faces}</TableCell>
              <TableCell>{r.has_edge_band ? "Yes" : "No"}</TableCell>
              <TableCell className="text-right">
                <button type="button" onClick={() => handleDelete(r.id)} aria-label="Remove row">
                  <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No cut-list rows yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {adding ? (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap items-end gap-2">
          <Controller
            control={control}
            name="boardGrade"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-44" size="sm">
                  <SelectValue>{() => field.value || "Board grade"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {rates.map((r) => (
                    <SelectItem key={r.id} value={r.board_grade}>
                      {r.board_grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Input type="number" placeholder="Qty" className="w-16" {...register("qty", { valueAsNumber: true })} />
          <Input type="number" step="0.01" placeholder="Length" className="w-20" {...register("panelLength", { valueAsNumber: true })} />
          <Input type="number" step="0.01" placeholder="Width" className="w-20" {...register("panelWidth", { valueAsNumber: true })} />
          <Controller
            control={control}
            name="laminateFaces"
            render={({ field }) => (
              <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v) as 0 | 1 | 2)}>
                <SelectTrigger className="w-32" size="sm">
                  <SelectValue>{() => `${field.value} faces`}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 faces</SelectItem>
                  <SelectItem value="1">1 face</SelectItem>
                  <SelectItem value="2">2 faces</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <div className="flex items-center gap-1.5">
            <Controller
              control={control}
              name="hasEdgeBand"
              render={({ field }) => (
                <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(Boolean(c))} />
              )}
            />
            <span className="text-xs text-muted-foreground">Edge band</span>
          </div>
          <Input type="number" step="0.01" placeholder="Wastage %" className="w-24" {...register("wastagePct", { valueAsNumber: true })} />
          <Button type="submit" size="sm" disabled={isSubmitting}>
            Add
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </form>
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)} disabled={rates.length === 0}>
          <Plus className="size-3.5" />
          Add cut-list row
        </Button>
      )}
      {rates.length === 0 && (
        <p className="text-xs text-muted-foreground">Add a board grade rate below before adding cut-list rows.</p>
      )}
    </div>
  );
}
