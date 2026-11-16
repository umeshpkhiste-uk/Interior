"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteExpense } from "@/lib/actions/expenses";
import { formatINR } from "@/lib/calculations/shared";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expenses";
import type { ProjectCostListItem } from "@/lib/data/project-costs";

export function ProjectCostsTable({ costs }: { costs: ProjectCostListItem[] }) {
  const router = useRouter();

  if (costs.length === 0) {
    return <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">No costs logged yet.</div>;
  }

  async function handleDelete(cost: ProjectCostListItem) {
    const result = await deleteExpense(cost.id, cost.project_id);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Cost Head</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {costs.map((cost) => (
            <TableRow key={cost.id}>
              <TableCell className="text-muted-foreground">
                {new Date(`${cost.expense_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </TableCell>
              <TableCell className="text-muted-foreground">{cost.projectCode}</TableCell>
              <TableCell>{EXPENSE_CATEGORY_LABELS[cost.category]}</TableCell>
              <TableCell className="text-muted-foreground">{cost.description ?? "—"}</TableCell>
              <TableCell className="text-right font-medium">{formatINR(cost.amount)}</TableCell>
              <TableCell className="text-right">
                <button type="button" onClick={() => handleDelete(cost)} aria-label="Remove cost">
                  <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
