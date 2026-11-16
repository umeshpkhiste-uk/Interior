"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deletePayment } from "@/lib/actions/expenses";
import { formatINR } from "@/lib/calculations/shared";
import { PAYMENT_DIRECTION_LABELS } from "@/lib/validations/expenses";
import type { ClientReceiptListItem } from "@/lib/data/client-receipts";

export function ReceiptsTable({ receipts }: { receipts: ClientReceiptListItem[] }) {
  const router = useRouter();

  if (receipts.length === 0) {
    return <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">No receipts recorded yet.</div>;
  }

  async function handleDelete(receipt: ClientReceiptListItem) {
    const result = await deletePayment(receipt.id, receipt.project_id);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((receipt) => (
            <TableRow key={receipt.id}>
              <TableCell className="text-muted-foreground">
                {new Date(`${receipt.payment_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </TableCell>
              <TableCell className="text-muted-foreground">{receipt.invoiceNumber ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{receipt.projectCode}</TableCell>
              <TableCell className="text-muted-foreground">{receipt.clientName}</TableCell>
              <TableCell className="text-muted-foreground">{PAYMENT_DIRECTION_LABELS[receipt.direction]}</TableCell>
              <TableCell className="text-right font-medium">{formatINR(receipt.amount)}</TableCell>
              <TableCell className="text-muted-foreground">{receipt.method ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{receipt.reference_note ?? "—"}</TableCell>
              <TableCell className="text-right">
                <button type="button" onClick={() => handleDelete(receipt)} aria-label="Remove receipt">
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
