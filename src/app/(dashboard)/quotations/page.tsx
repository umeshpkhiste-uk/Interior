import Link from "next/link";
import { FileText } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listAllQuotations } from "@/lib/data/quotations";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QuotationStatusBadge } from "@/components/quotations/quotation-status-badge";
import { formatINR } from "@/lib/calculations/shared";

export default async function QuotationsPage() {
  const ctx = await requireCurrentUserContext();
  const quotations = await listAllQuotations(ctx.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Quotations</h1>
        <p className="text-sm text-muted-foreground">Every quotation across all projects. Create new ones from a project&apos;s Quotations tab.</p>
      </div>

      {quotations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No quotations yet</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Grand total</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotations.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium">{q.quotation_number}</TableCell>
                <TableCell>{q.projectName}</TableCell>
                <TableCell className="text-muted-foreground">{q.clientName}</TableCell>
                <TableCell>
                  <QuotationStatusBadge status={q.status} />
                </TableCell>
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
