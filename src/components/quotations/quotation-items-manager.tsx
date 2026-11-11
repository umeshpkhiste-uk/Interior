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
import { addQuotationItem, deleteQuotationItem } from "@/lib/actions/quotations";
import { formatINR } from "@/lib/calculations/shared";
import { quotationItemSchema, type QuotationItemInput } from "@/lib/validations/quotation";
import type { QuotationItemRow } from "@/lib/data/quotations";

export function QuotationItemsManager({
  quotationId,
  projectId,
  items,
  editable,
}: {
  quotationId: string;
  projectId: string;
  items: QuotationItemRow[];
  editable: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<QuotationItemInput>({
    resolver: zodResolver(quotationItemSchema),
    defaultValues: { roomLabel: "", itemDescription: "", specification: "", unit: "lot", quantity: 1, rate: 0 },
  });

  async function submit(values: QuotationItemInput) {
    const result = await addQuotationItem(quotationId, projectId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    reset();
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deleteQuotationItem(id, quotationId, projectId);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Amount</TableHead>
            {editable && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.item_description}</TableCell>
              <TableCell>
                {Number(item.quantity)} {item.unit}
              </TableCell>
              <TableCell>{formatINR(Number(item.rate))}</TableCell>
              <TableCell className="font-medium">{formatINR(Number(item.amount))}</TableCell>
              {editable && (
                <TableCell className="text-right">
                  <button type="button" onClick={() => handleDelete(item.id)} aria-label="Remove item">
                    <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </TableCell>
              )}
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={editable ? 5 : 4} className="text-center text-muted-foreground">
                No extra items outside the BOQ.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {editable &&
        (adding ? (
          <form onSubmit={handleSubmit(submit)} className="flex flex-wrap items-end gap-2">
            <Input placeholder="Description" className="w-56" {...register("itemDescription")} />
            <Input type="number" placeholder="Qty" className="w-20" {...register("quantity", { valueAsNumber: true })} />
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
            Add extra item
          </Button>
        ))}
    </div>
  );
}
