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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addPayment, deletePayment } from "@/lib/actions/expenses";
import { formatINR } from "@/lib/calculations/shared";
import { paymentSchema, PAYMENT_DIRECTIONS, PAYMENT_DIRECTION_LABELS, type PaymentInput } from "@/lib/validations/expenses";
import type { PaymentRow } from "@/lib/data/expenses";

export function PaymentsManager({ projectId, payments }: { projectId: string; payments: PaymentRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { direction: "client_payment", amount: 0, paymentDate: "", method: "", referenceNote: "" },
  });

  const totalReceived = payments
    .filter((p) => p.direction === "client_payment" || p.direction === "client_advance")
    .reduce((s, p) => s + Number(p.amount), 0);
  const totalPaidToSuppliers = payments.filter((p) => p.direction === "supplier_payment").reduce((s, p) => s + Number(p.amount), 0);

  async function submit(values: PaymentInput) {
    const result = await addPayment(projectId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    reset();
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deletePayment(id, projectId);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-4 text-sm font-medium">
        <p>Received from client: {formatINR(totalReceived)}</p>
        <p>Paid to suppliers: {formatINR(totalPaidToSuppliers)}</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="text-muted-foreground">{p.payment_date}</TableCell>
              <TableCell>{PAYMENT_DIRECTION_LABELS[p.direction]}</TableCell>
              <TableCell className="font-medium">{formatINR(Number(p.amount))}</TableCell>
              <TableCell className="text-muted-foreground">{p.method ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{p.reference_note ?? "—"}</TableCell>
              <TableCell className="text-right">
                <button type="button" onClick={() => handleDelete(p.id)} aria-label="Remove payment">
                  <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </TableCell>
            </TableRow>
          ))}
          {payments.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No payments recorded yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {adding ? (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap items-end gap-2">
          <Controller
            control={control}
            name="direction"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-40" size="sm">
                  <SelectValue>{(v: string | null) => PAYMENT_DIRECTION_LABELS[v as keyof typeof PAYMENT_DIRECTION_LABELS] ?? "Select"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_DIRECTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {PAYMENT_DIRECTION_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Input type="number" step="0.01" placeholder="Amount" className="w-28" {...register("amount", { valueAsNumber: true })} />
          <Input type="date" className="w-40" {...register("paymentDate")} />
          <Input placeholder="Method (UPI, cheque...)" className="w-40" {...register("method")} />
          <Input placeholder="Reference" className="w-40" {...register("referenceNote")} />
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
          Add payment
        </Button>
      )}
    </div>
  );
}
