import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { buildQuotationPdfData } from "@/lib/pdf/quotation-pdf-data";
import { QuotationDocument } from "@/lib/pdf/quotation-document";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireCurrentUserContext();
  const data = await buildQuotationPdfData(ctx.organizationId, id);
  if (!data) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

  const buffer = await renderToBuffer(<QuotationDocument data={data} />);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${data.quotationNumber.replace(/\//g, "-")}.pdf"`,
    },
  });
}
