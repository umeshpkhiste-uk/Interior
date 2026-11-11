import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type PanelCutRow = Database["public"]["Tables"]["panel_cut_lists"]["Row"];
export type PlywoodRateRow = Database["public"]["Tables"]["plywood_rates"]["Row"];
export type PlywoodProjectSettingsRow = Database["public"]["Tables"]["plywood_project_settings"]["Row"];

export async function listCutListRows(organizationId: string, projectId: string): Promise<PanelCutRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("panel_cut_lists")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listPlywoodRates(organizationId: string): Promise<PlywoodRateRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plywood_rates")
    .select("*")
    .eq("organization_id", organizationId)
    .order("board_grade", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getPlywoodProjectSettings(
  organizationId: string,
  projectId: string
): Promise<PlywoodProjectSettingsRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plywood_project_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}
