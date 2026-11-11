"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { computePaintQuantities, paintCost, paintPrice } from "@/lib/calculations/paint";
import { paintEstimationSchema, type PaintEstimationInput } from "@/lib/validations/paint";
import type { ActionResult } from "@/lib/actions/clients";

async function recomputePaint(paintEstimationId: string) {
  const supabase = await createClient();
  const { data: row, error } = await supabase.from("paint_estimations").select("*").eq("id", paintEstimationId).single();
  if (error) throw error;

  const quantities = computePaintQuantities({
    netWallArea: Number(row.net_wall_area),
    ceilingArea: Number(row.ceiling_area),
    featureWallArea: Number(row.feature_wall_area),
    coats: row.coats,
    paintCoveragePerLitre: Number(row.paint_coverage_per_litre ?? 0),
    primerCoverage: Number(row.primer_coverage ?? 0),
    puttyCoverage: Number(row.putty_coverage ?? 0),
    canSize: Number(row.can_size ?? 0),
    wallpaperRollLength: Number(row.wallpaper_roll_length ?? 0),
    wallpaperRollWidth: Number(row.wallpaper_roll_width ?? 0),
    wastagePct: Number(row.wastage_pct),
  });
  const breakdown = paintCost({
    ...quantities,
    paintRate: Number(row.paint_rate ?? 0),
    primerRate: Number(row.primer_rate ?? 0),
    puttyRate: Number(row.putty_rate ?? 0),
    labourRate: Number(row.labour_rate ?? 0),
    wallpaperRate: Number(row.wallpaper_rate ?? 0),
    wallpaperFixingRate: Number(row.wallpaper_fixing_rate),
  });
  const price = paintPrice(breakdown.cost, Number(row.margin_pct), Number(row.rounding_unit));

  const { error: updateError } = await supabase
    .from("paint_estimations")
    .update({ material_cost: breakdown.material, labour_cost: breakdown.labour, total_cost: breakdown.cost, selling_price: price })
    .eq("id", paintEstimationId);
  if (updateError) throw updateError;
}

function toRow(input: PaintEstimationInput) {
  return {
    room_id: input.roomId || null,
    net_wall_area: input.netWallArea,
    ceiling_area: input.ceilingArea,
    feature_wall_area: input.featureWallArea,
    coats: input.coats,
    paint_coverage_per_litre: input.paintCoveragePerLitre,
    primer_coverage: input.primerCoverage,
    putty_coverage: input.puttyCoverage,
    can_size: input.canSize,
    paint_rate: input.paintRate,
    primer_rate: input.primerRate,
    putty_rate: input.puttyRate,
    labour_rate: input.labourRate,
    wallpaper_roll_length: input.wallpaperRollLength,
    wallpaper_roll_width: input.wallpaperRollWidth,
    wallpaper_rate: input.wallpaperRate,
    wallpaper_fixing_rate: input.wallpaperFixingRate,
    wastage_pct: input.wastagePct / 100,
    paint_brand: input.paintBrand || null,
    finish_type: input.finishType || null,
    margin_pct: input.marginPct / 100,
    rounding_unit: input.roundingUnit,
  };
}

export async function createPaintEstimation(
  projectId: string,
  input: PaintEstimationInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = paintEstimationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("paint_estimations")
    .insert({ organization_id: ctx.organizationId, project_id: projectId, ...toRow(parsed.data) })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await recomputePaint(data.id);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: { id: data.id } };
}

export async function updatePaintEstimation(
  estimationId: string,
  projectId: string,
  input: PaintEstimationInput
): Promise<ActionResult> {
  const parsed = paintEstimationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("paint_estimations")
    .update(toRow(parsed.data))
    .eq("id", estimationId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };

  await recomputePaint(estimationId);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function deletePaintEstimation(estimationId: string, projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("paint_estimations")
    .delete()
    .eq("id", estimationId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}
