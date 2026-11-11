"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { flooringCost, flooringPrice } from "@/lib/calculations/flooring";
import { flooringEstimationSchema, type FlooringEstimationInput } from "@/lib/validations/flooring";
import type { ActionResult } from "@/lib/actions/clients";

async function recomputeFlooring(estimationId: string) {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("flooring_estimations")
    .select("*, project_rooms(floor_area)")
    .eq("id", estimationId)
    .single();
  if (error) throw error;

  const roomArea = Number((row as { project_rooms: { floor_area: number } | null }).project_rooms?.floor_area ?? 0);
  const breakdown = flooringCost({
    flooringType: row.flooring_type,
    roomArea,
    tileLength: Number(row.tile_length ?? 0),
    tileWidth: Number(row.tile_width ?? 0),
    wastagePct: Number(row.wastage_pct),
    pricePerBox: Number(row.price_per_box ?? 0),
    piecesPerBox: row.pieces_per_box ?? 0,
    layingLabourRate: Number(row.laying_labour_rate ?? 0),
    adhesiveGroutRate: Number(row.adhesive_grout_rate ?? 0),
    skirtingLength: Number(row.skirting_length),
    skirtingRate: Number(row.skirting_rate),
  });
  const price = flooringPrice(breakdown.cost, Number(row.margin_pct), Number(row.rounding_unit));

  const { error: updateError } = await supabase
    .from("flooring_estimations")
    .update({ material_cost: breakdown.material, labour_cost: breakdown.labour, total_cost: breakdown.cost, selling_price: price })
    .eq("id", estimationId);
  if (updateError) throw updateError;
}

export async function saveFlooringEstimation(
  roomId: string,
  projectId: string,
  input: FlooringEstimationInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = flooringEstimationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const v = parsed.data;
  const row = {
    flooring_type: v.flooringType,
    tile_length: v.tileLength,
    tile_width: v.tileWidth,
    price_per_box: v.pricePerBox,
    pieces_per_box: v.piecesPerBox,
    wastage_pct: v.wastagePct / 100,
    laying_labour_rate: v.layingLabourRate,
    adhesive_grout_rate: v.adhesiveGroutRate,
    skirting_length: v.skirtingLength,
    skirting_rate: v.skirtingRate,
    margin_pct: v.marginPct / 100,
    rounding_unit: v.roundingUnit,
  };

  const { data: existing } = await supabase
    .from("flooring_estimations")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("room_id", roomId)
    .maybeSingle();

  let id: string;
  if (existing) {
    const { error } = await supabase.from("flooring_estimations").update(row).eq("id", existing.id);
    if (error) return { error: error.message };
    id = existing.id;
  } else {
    const { data, error } = await supabase
      .from("flooring_estimations")
      .insert({ organization_id: ctx.organizationId, room_id: roomId, ...row })
      .select("id")
      .single();
    if (error) return { error: error.message };
    id = data.id;
  }

  await recomputeFlooring(id);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: { id } };
}
