"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InvoiceFormDialog } from "./invoice-form-dialog";
import { formatINR } from "@/lib/calculations/shared";
import type { InvoiceListItem } from "@/lib/data/invoices";
import type { ProjectOption } from "@/lib/data/projects";

export function InvoicesTable({ invoices, projectOptions }: { invoices: InvoiceListItem[]; projectOptions: ProjectOption[] }) {
  const [editing, setEditing] = useState<InvoiceListItem | null>(null);

  if (invoices.length === 0) {
    return <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">No invoices raised yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice No.</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Milestone</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Received</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className="cursor-pointer" onClick={() => setEditing(invoice)}>
              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(`${invoice.invoice_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </TableCell>
              <TableCell className="text-muted-foreground">{invoice.projectCode}</TableCell>
              <TableCell className="text-muted-foreground">{invoice.clientName}</TableCell>
              <TableCell className="text-muted-foreground">{invoice.milestone}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(invoice.amount)}</TableCell>
              <TableCell className="text-right font-medium">{formatINR(invoice.total)}</TableCell>
              <TableCell className="text-muted-foreground">
                {invoice.due_date ? new Date(`${invoice.due_date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(invoice.received)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(invoice.balance)}</TableCell>
              <TableCell>
                <Badge variant={invoice.statusLabel === "Paid" ? "default" : "secondary"}>{invoice.statusLabel}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing && (
        <InvoiceFormDialog projectOptions={projectOptions} invoice={editing} trigger={null} open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} />
      )}
    </div>
  );
}
