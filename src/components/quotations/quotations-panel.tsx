import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/calculations/shared";
import { QuotationStatusBadge } from "./quotation-status-badge";
import { CreateQuotationDraftButton } from "./create-quotation-draft-button";
import type { QuotationRow } from "@/lib/data/quotations";

export function QuotationsPanel({ projectId, quotations }: { projectId: string; quotations: QuotationRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CreateQuotationDraftButton projectId={projectId} />
      </div>

      {quotations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No quotations yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Sync the BOQ first, then create a quotation — it starts from the current BOQ total.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Grand total</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium">{q.quotation_number}</TableCell>
                <TableCell>
                  <QuotationStatusBadge status={q.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{q.quotation_date}</TableCell>
                <TableCell>{formatINR(Number(q.grand_total))}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/quotations/${q.id}`} className="text-sm text-primary hover:underline">
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
