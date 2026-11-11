"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { ceilingCoverageArea, ceilingCost, ceilingPrice } from "@/lib/calculations/false-ceiling";
import { ceilingEstimationSchema, type CeilingEstimationInput } from "@/lib/validations/false-ceiling";
import type { ActionResult } from "@/lib/actions/clients";

async function recomputeCeiling(ceilingEstimationId: string) {
  const supabase = await createClient();
  const { data: row, error: rowError } = await supabase
    .from("ceiling_estimations")
    .select("*, project_rooms(floor_area)")
    .eq("id", ceilingEstimationId)
    .single();
  if (rowError) throw rowError;

  const floorArea = Number((row as { project_rooms: { floor_area: number } | null }).project_rooms?.floor_area ?? 0);
  const area = ceilingCoverageArea(floorArea, Number(row.cover_pct));
  const breakdown = ceilingCost({
    area,
    materialRate: Number(row.material_rate),
    labourRate: Number(row.labour_rate),
    downlightQty: row.downlight_qty,
    lightingRate: Number(row.lighting_rate),
    coveLength: Number(row.cove_length),
    ledStripRate: Number(row.led_strip_rate),
    coveLabourRate: Number(row.cove_labour_rate),
  });
  const price = ceilingPrice(breakdown.cost, Number(row.margin_pct), Number(row.rounding_unit));

  const { error } = await supabase
    .from("ceiling_estimations")
    .update({ material_cost: breakdown.material, labour_cost: breakdown.labour, total_cost: breakdown.cost, selling_price: price })
    .eq("id", ceilingEstimationId);
  if (error) throw error;
}

export async function saveCeilingEstimation(
  roomId: string,
  projectId: string,
  input: CeilingEstimationInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = ceilingEstimationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const v = parsed.data;
  const row = {
    ceiling_type: v.ceilingType,
    cover_pct: v.coverPct / 100,
    design: v.design,
    cove_length: v.coveLength,
    led_strip_length: v.ledStripLength,
    downlight_qty: v.downlightQty,
    material_rate: v.materialRate,
    labour_rate: v.labourRate,
    board_dimensions: v.boardDimensions || null,
    wastage_pct: v.wastagePct / 100,
    lighting_rate: v.lightingRate,
    led_strip_rate: v.ledStripRate,
    cove_labour_rate: v.coveLabourRate,
    margin_pct: v.marginPct / 100,
    rounding_unit: v.roundingUnit,
  };

  const { data: existing } = await supabase
    .from("ceiling_estimations")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("room_id", roomId)
    .maybeSingle();

  let id: string;
  if (existing) {
    const { error } = await supabase.from("ceiling_estimations").update(row).eq("id", existing.id);
    if (error) return { error: error.message };
    id = existing.id;
  } else {
    const { data, error } = await supabase
      .from("ceiling_estimations")
      .insert({ organization_id: ctx.organizationId, room_id: roomId, ...row })
      .select("id")
      .single();
    if (error) return { error: error.message };
    id = data.id;
  }

  await recomputeCeiling(id);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: { id } };
}
