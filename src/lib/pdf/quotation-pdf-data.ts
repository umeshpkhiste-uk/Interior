import { createClient } from "@/lib/supabase/server";

export interface QuotationPdfLine {
  description: string;
  unit: string | null;
  quantity: number;
  rate: number;
  amount: number;
}

export interface QuotationPdfStage {
  name: string;
  pct: number;
  amount: number;
}

export interface QuotationPdfData {
  organizationName: string;
  organizationAddress: string | null;
  organizationGstin: string | null;
  organizationContactPhone: string | null;
  organizationContactEmail: string | null;
  quotationNumber: string;
  status: string;
  quotationDate: string;
  validityDate: string | null;
  projectName: string;
  clientName: string;
  propertyAddress: string | null;
  roomLines: QuotationPdfLine[];
  extraLines: QuotationPdfLine[];
  subtotal: number;
  contingencyAmount: number;
  grossAmount: number;
  discountAmount: number;
  taxableAmount: number;
  gstPct: number;
  gstAmount: number;
  roundOff: number;
  grandTotal: number;
  paymentStages: QuotationPdfStage[];
}

/**
 * Normalizes a quotation's data for PDF rendering. A sent/approved
 * quotation reads from its immutable snapshot (mapping doc decision #9)
 * rather than live BOQ/rate tables, so a PDF generated after rates change
 * elsewhere still matches exactly what was originally sent.
 */
export async function buildQuotationPdfData(organizationId: string, quotationId: string): Promise<QuotationPdfData | null> {
  const supabase = await createClient();

  const { data: quotation, error } = await supabase
    .from("quotations")
    .select("*, projects(name, property_address, clients(name))")
    .eq("organization_id", organizationId)
    .eq("id", quotationId)
    .maybeSingle();
  if (error) throw error;
  if (!quotation) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("name, address, gstin, contact_phone, contact_email")
    .eq("id", organizationId)
    .single();

  const project = (quotation as unknown as { projects: { name: string; property_address: string | null; clients: { name: string } | null } }).projects;

  let roomLines: QuotationPdfLine[];
  let extraLines: QuotationPdfLine[];

  if (quotation.status === "draft") {
    const [{ data: boqItems }, { data: quotationItems }] = await Promise.all([
      supabase.from("boq_items").select("*").eq("project_id", quotation.project_id),
      supabase.from("quotation_items").select("*").eq("quotation_id", quotationId),
    ]);
    roomLines = (boqItems ?? []).map((i) => ({
      description: i.item_description, unit: i.unit, quantity: Number(i.quantity), rate: Number(i.total_rate), amount: Number(i.amount),
    }));
    extraLines = (quotationItems ?? []).map((i) => ({
      description: i.item_description, unit: i.unit, quantity: Number(i.quantity), rate: Number(i.rate), amount: Number(i.amount),
    }));
  } else {
    const { data: snapshotRow } = await supabase
      .from("quotation_snapshots")
      .select("snapshot")
      .eq("quotation_id", quotationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const snapshot = snapshotRow?.snapshot as {
      boqItems?: Array<{ item_description: string; unit: string | null; quantity: number; total_rate: number; amount: number }>;
      items?: Array<{ item_description: string; unit: string | null; quantity: number; rate: number; amount: number }>;
    } | null;
    roomLines = (snapshot?.boqItems ?? []).map((i) => ({
      description: i.item_description, unit: i.unit, quantity: Number(i.quantity), rate: Number(i.total_rate), amount: Number(i.amount),
    }));
    extraLines = (snapshot?.items ?? []).map((i) => ({
      description: i.item_description, unit: i.unit, quantity: Number(i.quantity), rate: Number(i.rate), amount: Number(i.amount),
    }));
  }

  const { data: stages } = await supabase
    .from("quotation_payment_stages")
    .select("*")
    .eq("quotation_id", quotationId)
    .order("created_at", { ascending: true });

  return {
    organizationName: org?.name ?? "Studio",
    organizationAddress: org?.address ?? null,
    organizationGstin: org?.gstin ?? null,
    organizationContactPhone: org?.contact_phone ?? null,
    organizationContactEmail: org?.contact_email ?? null,
    quotationNumber: quotation.quotation_number,
    status: quotation.status,
    quotationDate: quotation.quotation_date,
    validityDate: quotation.validity_date,
    projectName: project?.name ?? "—",
    clientName: project?.clients?.name ?? "—",
    propertyAddress: project?.property_address ?? null,
    roomLines,
    extraLines,
    subtotal: Number(quotation.subtotal),
    contingencyAmount: Number(quotation.contingency_amount),
    grossAmount: Number(quotation.gross_amount),
    discountAmount: Number(quotation.discount_amount),
    taxableAmount: Number(quotation.taxable_amount),
    gstPct: Number(quotation.gst_pct),
    gstAmount: Number(quotation.gst_amount),
    roundOff: Number(quotation.round_off),
    grandTotal: Number(quotation.grand_total),
    paymentStages: (stages ?? []).map((s) => ({ name: s.stage_name, pct: Number(s.stage_pct ?? 0), amount: Number(s.stage_amount) })),
  };
}
