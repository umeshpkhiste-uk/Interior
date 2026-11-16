"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { WeeklyPaymentFormDialog } from "./weekly-payment-form-dialog";
import { formatINR } from "@/lib/calculations/shared";
import { LABOUR_PAYMENT_MODE_LABELS } from "@/lib/validations/labour-weekly-payment";
import type { LabourWeeklyPaymentListItem } from "@/lib/data/labour-weekly-payments";
import type { WorkerOption } from "@/lib/data/workers";

export function WeeklyPaymentsTable({ payments, workerOptions }: { payments: LabourWeeklyPaymentListItem[]; workerOptions: WorkerOption[] }) {
  const [editing, setEditing] = useState<LabourWeeklyPaymentListItem | null>(null);

  if (payments.length === 0) {
    return <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">No weekly payments logged yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Week Starting</TableHead>
            <TableHead>Worker</TableHead>
            <TableHead className="text-right">Earned</TableHead>
            <TableHead className="text-right">Advance Recovered</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id} className="cursor-pointer" onClick={() => setEditing(payment)}>
              <TableCell className="text-muted-foreground">
                {new Date(`${payment.week_starting}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </TableCell>
              <TableCell className="font-medium">
                {payment.workerCode} — {payment.workerName}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(payment.earned)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(payment.advance_recovered)}</TableCell>
              <TableCell className="text-right font-medium">{formatINR(payment.paid)}</TableCell>
              <TableCell className="text-muted-foreground">{LABOUR_PAYMENT_MODE_LABELS[payment.mode as keyof typeof LABOUR_PAYMENT_MODE_LABELS] ?? payment.mode}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(payment.balance)}</TableCell>
              <TableCell>
                <Badge variant={payment.statusLabel === "Paid" ? "default" : "secondary"}>{payment.statusLabel}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing && (
        <WeeklyPaymentFormDialog workerOptions={workerOptions} payment={editing} trigger={null} open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} />
      )}
    </div>
  );
}
