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
import { addExpense, deleteExpense } from "@/lib/actions/expenses";
import { formatINR } from "@/lib/calculations/shared";
import { expenseSchema, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, type ExpenseInput } from "@/lib/validations/expenses";
import type { ExpenseRow } from "@/lib/data/expenses";

export function ExpensesManager({ projectId, expenses }: { projectId: string; expenses: ExpenseRow[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: "material_purchase", description: "", amount: 0, expenseDate: "" },
  });

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  async function submit(values: ExpenseInput) {
    const result = await addExpense(projectId, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    reset();
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deleteExpense(id, projectId);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Total expenses: {formatINR(total)}</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="text-muted-foreground">{e.expense_date}</TableCell>
              <TableCell>{EXPENSE_CATEGORY_LABELS[e.category]}</TableCell>
              <TableCell>{e.description ?? "—"}</TableCell>
              <TableCell className="font-medium">{formatINR(Number(e.amount))}</TableCell>
              <TableCell className="text-right">
                <button type="button" onClick={() => handleDelete(e.id)} aria-label="Remove expense">
                  <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </TableCell>
            </TableRow>
          ))}
          {expenses.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No expenses recorded yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {adding ? (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap items-end gap-2">
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-40" size="sm">
                  <SelectValue>{(v: string | null) => EXPENSE_CATEGORY_LABELS[v as keyof typeof EXPENSE_CATEGORY_LABELS] ?? "Select"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {EXPENSE_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Input placeholder="Description" className="w-56" {...register("description")} />
          <Input type="number" step="0.01" placeholder="Amount" className="w-28" {...register("amount", { valueAsNumber: true })} />
          <Input type="date" className="w-40" {...register("expenseDate")} />
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
          Add expense
        </Button>
      )}
    </div>
  );
}
