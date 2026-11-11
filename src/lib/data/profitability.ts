import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type ProjectSettingsRow = Database["public"]["Tables"]["project_settings"]["Row"];

export interface HeadCostTotals {
  material: number;
  labour: number;
  quotedPrice: number;
}

export interface ProfitabilityRawData {
  settings: ProjectSettingsRow | null;
  boqSubtotal: number;
  heads: Record<"kitchen" | "wardrobe" | "plywood" | "ceiling" | "paint" | "flooring" | "electrical", HeadCostTotals>;
  contingencyAndExtras: number;
  discountAmount: number;
}

export async function getProfitabilityRawData(organizationId: string, projectId: string): Promise<ProfitabilityRawData> {
  const supabase = await createClient();

  const [
    { data: settings },
    { data: boqItems },
    { data: kitchen },
    { data: wardrobes },
    { data: plywood },
    { data: rooms },
    { data: paints },
    { data: electrical },
    { data: latestQuotation },
    { data: boqSettings },
  ] = await Promise.all([
    supabase.from("project_settings").select("*").eq("organization_id", organizationId).eq("project_id", projectId).maybeSingle(),
    supabase.from("boq_items").select("amount").eq("organization_id", organizationId).eq("project_id", projectId),
    supabase.from("kitchen_estimations").select("material_cost, labour_cost, selling_price").eq("organization_id", organizationId).eq("project_id", projectId).maybeSingle(),
    supabase.from("wardrobes").select("material_cost, total_cost, selling_price").eq("organization_id", organizationId).eq("project_id", projectId),
    supabase.from("plywood_project_settings").select("material_cost, selling_price").eq("organization_id", organizationId).eq("project_id", projectId).maybeSingle(),
    supabase.from("project_rooms").select("id").eq("organization_id", organizationId).eq("project_id", projectId),
    supabase.from("paint_estimations").select("material_cost, labour_cost, selling_price").eq("organization_id", organizationId).eq("project_id", projectId),
    supabase.from("electrical_project_settings").select("material_cost, labour_cost, selling_price").eq("organization_id", organizationId).eq("project_id", projectId).maybeSingle(),
    supabase
      .from("quotations")
      .select("contingency_amount, discount_amount")
      .eq("organization_id", organizationId)
      .eq("project_id", projectId)
      .in("status", ["sent", "viewed", "approved"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("project_boq_settings").select("contingency_pct").eq("project_id", projectId).maybeSingle(),
  ]);

  const roomIds = new Set((rooms ?? []).map((r) => r.id));
  const [{ data: ceilings }, { data: floorings }] = await Promise.all([
    supabase.from("ceiling_estimations").select("room_id, material_cost, labour_cost, selling_price").eq("organization_id", organizationId),
    supabase.from("flooring_estimations").select("room_id, material_cost, labour_cost, selling_price").eq("organization_id", organizationId),
  ]);
  const ceilingsForProject = (ceilings ?? []).filter((c) => roomIds.has(c.room_id));
  const flooringsForProject = (floorings ?? []).filter((f) => roomIds.has(f.room_id));

  const boqSubtotal = (boqItems ?? []).reduce((s, i) => s + Number(i.amount), 0);

  const sumRows = (rows: { material_cost: number; labour_cost: number; selling_price: number }[]): HeadCostTotals => ({
    material: rows.reduce((s, r) => s + Number(r.material_cost), 0),
    labour: rows.reduce((s, r) => s + Number(r.labour_cost), 0),
    quotedPrice: rows.reduce((s, r) => s + Number(r.selling_price), 0),
  });

  /** Wardrobe rows have no labour_cost column: Cost = Material×(1+labourPct), so Labour = Total-Material. */
  const sumWardrobeRows = (rows: { material_cost: number; total_cost: number; selling_price: number }[]): HeadCostTotals => ({
    material: rows.reduce((s, r) => s + Number(r.material_cost), 0),
    labour: rows.reduce((s, r) => s + (Number(r.total_cost) - Number(r.material_cost)), 0),
    quotedPrice: rows.reduce((s, r) => s + Number(r.selling_price), 0),
  });

  const contingencyAndExtras = latestQuotation
    ? Number(latestQuotation.contingency_amount)
    : boqSubtotal * Number(boqSettings?.contingency_pct ?? 0.05);
  const discountAmount = latestQuotation ? Number(latestQuotation.discount_amount) : 0;

  return {
    settings: settings ?? null,
    boqSubtotal,
    heads: {
      kitchen: kitchen
        ? { material: Number(kitchen.material_cost), labour: Number(kitchen.labour_cost), quotedPrice: Number(kitchen.selling_price) }
        : { material: 0, labour: 0, quotedPrice: 0 },
      wardrobe: sumWardrobeRows(wardrobes ?? []),
      plywood: plywood
        ? { material: Number(plywood.material_cost), labour: 0, quotedPrice: Number(plywood.selling_price) }
        : { material: 0, labour: 0, quotedPrice: 0 },
      ceiling: sumRows(ceilingsForProject),
      paint: sumRows(paints ?? []),
      flooring: sumRows(flooringsForProject),
      electrical: electrical
        ? { material: Number(electrical.material_cost), labour: Number(electrical.labour_cost), quotedPrice: Number(electrical.selling_price) }
        : { material: 0, labour: 0, quotedPrice: 0 },
    },
    contingencyAndExtras,
    discountAmount,
  };
}
