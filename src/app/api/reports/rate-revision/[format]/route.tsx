import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { buildRateRevisionReport } from "@/lib/reports/builders";
import { ReportDocument } from "@/lib/pdf/report-document";
import { buildReportWorkbook } from "@/lib/excel/report-workbook";

export async function GET(_request: Request, { params }: { params: Promise<{ format: string }> }) {
  const { format } = await params;
  if (format !== "pdf" && format !== "excel") return NextResponse.json({ error: "Unknown format" }, { status: 400 });

  const ctx = await requireCurrentUserContext();
  const report = await buildRateRevisionReport(ctx.organizationId);

  if (format === "pdf") {
    const buffer = await renderToBuffer(<ReportDocument report={report} />);
    return new NextResponse(new Uint8Array(buffer), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="rate-revision-report.pdf"` },
    });
  }

  const buffer = await buildReportWorkbook(report);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rate-revision-report.xlsx"`,
    },
  });
}
