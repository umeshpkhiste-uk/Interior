"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadQuotationStatusBadge } from "./lead-quotation-status-badge";
import { formatINR } from "@/lib/calculations/shared";
import { updateLeadQuotationStatus } from "@/lib/actions/lead-quotations";
import { LEAD_QUOTATION_STATUSES, LEAD_QUOTATION_STATUS_LABELS } from "@/lib/validations/lead-quotation";
import type { LeadQuotationListItem } from "@/lib/data/lead-quotations";

export function QuotationsTable({ quotations }: { quotations: LeadQuotationListItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (quotations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No quotations yet.
      </div>
    );
  }

  function changeStatus(quotationId: string, status: (typeof LEAD_QUOTATION_STATUSES)[number]) {
    startTransition(async () => {
      await updateLeadQuotationStatus(quotationId, status);
      router.refresh();
    });
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quote No.</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Lead ID</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Property</TableHead>
            <TableHead className="text-right">Quoted</TableHead>
            <TableHead className="text-right">Discount</TableHead>
            <TableHead className="text-right">Final</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Days Open</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.map((quote) => (
            <TableRow key={quote.id}>
              <TableCell className="font-medium">{quote.quote_number}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(`${quote.quote_date}T00:00:00`).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </TableCell>
              <TableCell>{quote.leadCode}</TableCell>
              <TableCell>{quote.clientName}</TableCell>
              <TableCell className="text-muted-foreground">{quote.property ?? "—"}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatINR(quote.quoted_amount)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {(quote.discount_pct * 100).toFixed(1)}%
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatINR(quote.final_amount ?? quote.quoted_amount)}
              </TableCell>
              <TableCell>
                {quote.isLatestForLead ? (
                  <Select
                    value={quote.status}
                    onValueChange={(value) =>
                      changeStatus(quote.id, value as (typeof LEAD_QUOTATION_STATUSES)[number])
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger size="sm" className="w-[120px]">
                      <SelectValue>
                        {(value: string | null) =>
                          value
                            ? LEAD_QUOTATION_STATUS_LABELS[value as keyof typeof LEAD_QUOTATION_STATUS_LABELS]
                            : "—"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_QUOTATION_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {LEAD_QUOTATION_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <LeadQuotationStatusBadge status={quote.status} />
                )}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {quote.daysOpen != null ? quote.daysOpen : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
