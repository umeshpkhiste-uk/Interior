"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { materialRateSchema, reviseRateSchema, type MaterialRateInput, type ReviseRateInput } from "@/lib/validations/rates";
import type { ActionResult } from "@/lib/actions/clients";

export async function createMaterialRate(input: MaterialRateInput): Promise<ActionResult> {
  const parsed = materialRateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const v = parsed.data;
  const { error } = await supabase.from("material_rates").insert({
    organization_id: ctx.organizationId,
    material_id: v.materialId,
    supplier_id: v.supplierId || null,
    current_rate: v.currentRate,
    effective_date: v.effectiveDate || null,
    planned_increase_pct: v.plannedIncreasePct / 100,
    round_step: v.roundStep,
    monthly_volume: v.monthlyVolume,
    market_low: v.marketLow ?? null,
    market_high: v.marketHigh ?? null,
    notes: v.notes || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/rates");
  return { error: null, data: undefined };
}

export async function updateMaterialRateSettings(materialRateId: string, input: MaterialRateInput): Promise<ActionResult> {
  const parsed = materialRateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const v = parsed.data;
  const { error } = await supabase
    .from("material_rates")
    .update({
      supplier_id: v.supplierId || null,
      planned_increase_pct: v.plannedIncreasePct / 100,
      round_step: v.roundStep,
      monthly_volume: v.monthlyVolume,
      market_low: v.marketLow ?? null,
      market_high: v.marketHigh ?? null,
      notes: v.notes || null,
    })
    .eq("id", materialRateId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath("/rates");
  return { error: null, data: undefined };
}

/**
 * Applies the suggested revised rate (or a manually typed one) as the new
 * current_rate, logging the change to the append-only rate_history table.
 * Never touches any already-sent quotation_snapshots row (decision #9).
 */
export async function applyRateRevision(materialRateId: string, input: ReviseRateInput): Promise<ActionResult> {
  const parsed = reviseRateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data: rate, error: fetchError } = await supabase
    .from("material_rates")
    .select("current_rate")
    .eq("id", materialRateId)
    .eq("organization_id", ctx.organizationId)
    .single();
  if (fetchError) return { error: fetchError.message };

  const oldRate = Number(rate.current_rate);
  const newRate = parsed.data.newRate;

  const { error: updateError } = await supabase
    .from("material_rates")
    .update({ previous_rate: oldRate, current_rate: newRate, revised_rate: null, effective_date: new Date().toISOString().slice(0, 10), last_updated_at: new Date().toISOString() })
    .eq("id", materialRateId);
  if (updateError) return { error: updateError.message };

  const { error: historyError } = await supabase.from("rate_history").insert({
    organization_id: ctx.organizationId,
    material_rate_id: materialRateId,
    old_rate: oldRate,
    new_rate: newRate,
    changed_by: ctx.userId,
    reason: parsed.data.reason || null,
  });
  if (historyError) return { error: historyError.message };

  revalidatePath("/rates");
  return { error: null, data: undefined };
}
