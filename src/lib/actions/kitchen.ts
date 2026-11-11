"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { kitchenCost, kitchenPrice } from "@/lib/calculations/kitchen";
import {
  kitchenEstimationSchema,
  kitchenAccessorySchema,
  type KitchenEstimationInput,
  type KitchenAccessoryInput,
} from "@/lib/validations/kitchen";
import type { ActionResult } from "@/lib/actions/clients";

/** Recomputes material/labour/total cost + selling price for a kitchen estimation row and persists them. */
async function recomputeKitchen(kitchenEstimationId: string) {
  const supabase = await createClient();
  const { data: row, error: rowError } = await supabase
    .from("kitchen_estimations")
    .select("*")
    .eq("id", kitchenEstimationId)
    .single();
  if (rowError) throw rowError;

  const { data: accessories, error: accError } = await supabase
    .from("kitchen_accessories")
    .select("qty, rate")
    .eq("kitchen_estimation_id", kitchenEstimationId);
  if (accError) throw accError;

  const accessoriesTotal = (accessories ?? []).reduce((sum, a) => sum + Number(a.qty) * Number(a.rate), 0);

  const breakdown = kitchenCost({
    baseRft: Number(row.base_rft),
    wallRft: Number(row.wall_rft),
    tallQty: row.tall_qty,
    cornerQty: row.corner_qty,
    baseRate: Number(row.base_rate),
    wallRate: Number(row.wall_rate),
    tallRate: Number(row.tall_rate),
    cornerRate: Number(row.corner_rate),
    countertopArea: Number(row.countertop_area),
    countertopRate: Number(row.countertop_rate),
    accessoriesTotal,
    wastagePct: Number(row.wastage_pct),
    installLabourPct: Number(row.install_labour_pct),
  });
  const price = kitchenPrice(breakdown.cost, Number(row.margin_pct), Number(row.rounding_unit));

  const { error: updateError } = await supabase
    .from("kitchen_estimations")
    .update({
      material_cost: breakdown.material,
      labour_cost: breakdown.labour,
      total_cost: breakdown.cost,
      selling_price: price,
    })
    .eq("id", kitchenEstimationId);
  if (updateError) throw updateError;
}

export async function saveKitchenEstimation(
  projectId: string,
  input: KitchenEstimationInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = kitchenEstimationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const v = parsed.data;

  const row = {
    layout_type: v.layoutType,
    base_rft: v.baseRft,
    wall_rft: v.wallRft,
    tall_qty: v.tallQty,
    corner_qty: v.cornerQty,
    base_rate: v.baseRate,
    wall_rate: v.wallRate,
    tall_rate: v.tallRate,
    corner_rate: v.cornerRate,
    countertop_area: v.countertopArea,
    countertop_rate: v.countertopRate,
    install_labour_pct: v.installLabourPct / 100,
    wastage_pct: v.wastagePct / 100,
    margin_pct: v.marginPct / 100,
    rounding_unit: v.roundingUnit,
  };

  const { data: existing } = await supabase
    .from("kitchen_estimations")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .maybeSingle();

  let id: string;
  if (existing) {
    const { error } = await supabase.from("kitchen_estimations").update(row).eq("id", existing.id);
    if (error) return { error: error.message };
    id = existing.id;
  } else {
    const { data, error } = await supabase
      .from("kitchen_estimations")
      .insert({ organization_id: ctx.organizationId, project_id: projectId, ...row })
      .select("id")
      .single();
    if (error) return { error: error.message };
    id = data.id;
  }

  await recomputeKitchen(id);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: { id } };
}

export async function addKitchenAccessory(
  kitchenEstimationId: string,
  projectId: string,
  input: KitchenAccessoryInput
): Promise<ActionResult> {
  const parsed = kitchenAccessorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("kitchen_accessories").insert({
    organization_id: ctx.organizationId,
    kitchen_estimation_id: kitchenEstimationId,
    name: parsed.data.name,
    qty: parsed.data.qty,
    rate: parsed.data.rate,
    amount: parsed.data.qty * parsed.data.rate,
  });
  if (error) return { error: error.message };

  await recomputeKitchen(kitchenEstimationId);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function removeKitchenAccessory(
  accessoryId: string,
  kitchenEstimationId: string,
  projectId: string
): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("kitchen_accessories")
    .delete()
    .eq("id", accessoryId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };

  await recomputeKitchen(kitchenEstimationId);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}
