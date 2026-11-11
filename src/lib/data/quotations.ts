import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type QuotationRow = Database["public"]["Tables"]["quotations"]["Row"];
export type QuotationItemRow = Database["public"]["Tables"]["quotation_items"]["Row"];
export type PaymentStageRow = Database["public"]["Tables"]["quotation_payment_stages"]["Row"];
export type QuotationSnapshotRow = Database["public"]["Tables"]["quotation_snapshots"]["Row"];

export type QuotationListItem = QuotationRow & { projectName: string; clientName: string };

export async function listAllQuotations(organizationId: string): Promise<QuotationListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotations")
    .select("*, projects(name, clients(name))")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { projects, ...rest } = row as typeof row & { projects: { name: string; clients: { name: string } | null } | null };
    return { ...rest, projectName: projects?.name ?? "—", clientName: projects?.clients?.name ?? "—" };
  });
}

export async function listQuotations(organizationId: string, projectId: string): Promise<QuotationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type QuotationDetail = QuotationRow & {
  items: QuotationItemRow[];
  paymentStages: PaymentStageRow[];
  latestSnapshot: QuotationSnapshotRow | null;
};

export async function getQuotationById(organizationId: string, quotationId: string): Promise<QuotationDetail | null> {
  const supabase = await createClient();
  const { data: quotation, error } = await supabase
    .from("quotations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", quotationId)
    .maybeSingle();
  if (error) throw error;
  if (!quotation) return null;

  const [{ data: items, error: itemsError }, { data: stages, error: stagesError }, { data: snapshots, error: snapError }] =
    await Promise.all([
      supabase.from("quotation_items").select("*").eq("quotation_id", quotationId).order("created_at", { ascending: true }),
      supabase.from("quotation_payment_stages").select("*").eq("quotation_id", quotationId).order("created_at", { ascending: true }),
      supabase.from("quotation_snapshots").select("*").eq("quotation_id", quotationId).order("created_at", { ascending: false }).limit(1),
    ]);
  if (itemsError) throw itemsError;
  if (stagesError) throw stagesError;
  if (snapError) throw snapError;

  return { ...quotation, items: items ?? [], paymentStages: stages ?? [], latestSnapshot: snapshots?.[0] ?? null };
}

/** The most recent sent/approved quotation's taxable amount for a project (mapping doc decision #12). */
export async function getLatestTaxableAmount(organizationId: string, projectId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotations")
    .select("taxable_amount")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .in("status", ["sent", "viewed", "approved"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? Number(data.taxable_amount) : null;
}
