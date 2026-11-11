import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type MaterialRateRow = Database["public"]["Tables"]["material_rates"]["Row"];
export type RateHistoryRow = Database["public"]["Tables"]["rate_history"]["Row"];

export type MaterialRateWithNames = MaterialRateRow & { materialName: string; unit: string; supplierName: string | null };

export async function listMaterialRates(organizationId: string): Promise<MaterialRateWithNames[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("material_rates")
    .select("*, materials(name, unit), suppliers(name)")
    .eq("organization_id", organizationId)
    .order("last_updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { materials, suppliers, ...rest } = row as typeof row & {
      materials: { name: string; unit: string } | null;
      suppliers: { name: string } | null;
    };
    return { ...rest, materialName: materials?.name ?? "—", unit: materials?.unit ?? "", supplierName: suppliers?.name ?? null };
  });
}

export async function getMaterialRateHistory(organizationId: string, materialRateId: string): Promise<RateHistoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rate_history")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("material_rate_id", materialRateId)
    .order("changed_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type MaterialOption = { id: string; name: string; unit: string };

export async function listMaterialsWithoutRate(organizationId: string): Promise<MaterialOption[]> {
  const supabase = await createClient();
  const [{ data: materials, error: materialsError }, { data: rates, error: ratesError }] = await Promise.all([
    supabase.from("materials").select("id, name, unit").eq("organization_id", organizationId).is("archived_at", null),
    supabase.from("material_rates").select("material_id").eq("organization_id", organizationId),
  ]);
  if (materialsError) throw materialsError;
  if (ratesError) throw ratesError;
  const ratedIds = new Set((rates ?? []).map((r) => r.material_id));
  return (materials ?? []).filter((m) => !ratedIds.has(m.id)).map((m) => ({ id: m.id, name: m.name, unit: m.unit }));
}
