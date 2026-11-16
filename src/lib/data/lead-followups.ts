import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type LeadFollowupRow = Database["public"]["Tables"]["lead_followups"]["Row"];

export type LeadFollowupListItem = LeadFollowupRow & {
  leadCode: string;
  clientName: string;
  phone: string | null;
};

export async function listLeadFollowups(organizationId: string): Promise<LeadFollowupListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_followups")
    .select("*, leads(lead_code, client_name, phone)")
    .eq("organization_id", organizationId)
    .order("followup_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const { leads, ...rest } = row as typeof row & {
      leads: { lead_code: string; client_name: string; phone: string | null } | null;
    };
    return {
      ...rest,
      leadCode: leads?.lead_code ?? "—",
      clientName: leads?.client_name ?? "—",
      phone: leads?.phone ?? null,
    };
  });
}

/** Follow-up count per lead, for the Leads table's "Follow-ups" column. */
export async function countFollowupsByLead(organizationId: string): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_followups")
    .select("lead_id")
    .eq("organization_id", organizationId);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.lead_id, (counts.get(row.lead_id) ?? 0) + 1);
  }
  return counts;
}
