import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type LeadQuotationRow = Database["public"]["Tables"]["lead_quotations"]["Row"];

export type LeadQuotationListItem = LeadQuotationRow & {
  leadCode: string;
  clientName: string;
  property: string | null;
  isLatestForLead: boolean;
  daysOpen: number | null;
};

export async function listLeadQuotations(organizationId: string): Promise<LeadQuotationListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_quotations")
    .select("*, leads(lead_code, client_name, property_type)")
    .eq("organization_id", organizationId)
    .order("quote_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  const today = new Date();
  const seenLead = new Set<string>();

  return (data ?? []).map((row) => {
    const { leads, ...rest } = row as typeof row & {
      leads: { lead_code: string; client_name: string; property_type: string | null } | null;
    };
    const isLatestForLead = !seenLead.has(rest.lead_id);
    seenLead.add(rest.lead_id);
    const isOpen = isLatestForLead && (rest.status === "sent" || rest.status === "revised");

    return {
      ...rest,
      leadCode: leads?.lead_code ?? "—",
      clientName: leads?.client_name ?? "—",
      property: leads?.property_type ?? null,
      isLatestForLead,
      daysOpen: isOpen ? daysBetween(rest.quote_date, today) : null,
    };
  });
}

/** Latest quotation per lead (by quote date), for KPI/dashboard rollups and the Leads table's "Last Quote" column. */
export async function getLatestQuotationPerLead(
  organizationId: string
): Promise<Map<string, LeadQuotationRow>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_quotations")
    .select("*")
    .eq("organization_id", organizationId)
    .order("quote_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  const latest = new Map<string, LeadQuotationRow>();
  for (const row of data ?? []) {
    if (!latest.has(row.lead_id)) latest.set(row.lead_id, row);
  }
  return latest;
}

export function daysBetween(dateStr: string, today: Date): number {
  const date = new Date(`${dateStr}T00:00:00`);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((todayMidnight.getTime() - date.getTime()) / 86_400_000);
}
