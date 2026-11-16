"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VendorPaymentFormDialog } from "./vendor-payment-form-dialog";
import { formatINR } from "@/lib/calculations/shared";
import { VENDOR_PAYMENT_MODE_LABELS } from "@/lib/validations/vendor-payment";
import type { VendorPaymentListItem } from "@/lib/data/vendor-payments";
import type { VendorOption } from "@/lib/data/vendors";

export function VendorPaymentsTable({
  payments,
  vendorOptions,
}: {
  payments: VendorPaymentListItem[];
  vendorOptions: VendorOption[];
}) {
  const [editing, setEditing] = useState<VendorPaymentListItem | null>(null);

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No vendor payments logged yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Balance After</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id} className="cursor-pointer" onClick={() => setEditing(payment)}>
              <TableCell className="font-medium">
                {new Date(`${payment.payment_date}T00:00:00`).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </TableCell>
              <TableCell>
                {payment.vendorCode ? `${payment.vendorCode} — ` : ""}
                {payment.vendorName}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(payment.amount)}</TableCell>
              <TableCell className="text-muted-foreground">{VENDOR_PAYMENT_MODE_LABELS[payment.mode]}</TableCell>
              <TableCell className="text-muted-foreground">{payment.reference ?? "—"}</TableCell>
              <TableCell className="text-right">
                {payment.balanceAfter < 0 ? (
                  <Badge variant="outline">Advance {formatINR(-payment.balanceAfter)}</Badge>
                ) : (
                  <span className="font-medium">{formatINR(payment.balanceAfter)}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing && (
        <VendorPaymentFormDialog
          vendorOptions={vendorOptions}
          payment={editing}
          trigger={null}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}
