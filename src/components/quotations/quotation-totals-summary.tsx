import { formatINR } from "@/lib/calculations/shared";
import type { QuotationRow } from "@/lib/data/quotations";

export function QuotationTotalsSummary({ quotation }: { quotation: QuotationRow }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Rooms total" value={formatINR(Number(quotation.subtotal))} />
      <Stat label="Contingency" value={formatINR(Number(quotation.contingency_amount))} />
      <Stat label="Gross" value={formatINR(Number(quotation.gross_amount))} />
      <Stat label="Discount" value={`-${formatINR(Number(quotation.discount_amount))}`} />
      <Stat label="Taxable" value={formatINR(Number(quotation.taxable_amount))} />
      <Stat label="GST" value={formatINR(Number(quotation.gst_amount))} />
      <Stat label="Round off" value={formatINR(Number(quotation.round_off), { decimals: true })} />
      <Stat label="Grand total" value={formatINR(Number(quotation.grand_total))} highlight />
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 ${highlight ? "border-primary bg-primary/5" : ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-lg font-semibold">{value}</p>
    </div>
  );
}
