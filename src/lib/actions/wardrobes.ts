"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { wardrobeCost, wardrobePrice } from "@/lib/calculations/wardrobe";
import {
  wardrobeSchema,
  wardrobeComponentSchema,
  type WardrobeInput,
  type WardrobeComponentInput,
} from "@/lib/validations/wardrobe";
import type { ActionResult } from "@/lib/actions/clients";

async function recomputeWardrobe(wardrobeId: string) {
  const supabase = await createClient();
  const { data: row, error: rowError } = await supabase.from("wardrobes").select("*").eq("id", wardrobeId).single();
  if (rowError) throw rowError;

  const { data: components, error: compError } = await supabase
    .from("wardrobe_components")
    .select("qty, rate")
    .eq("wardrobe_id", wardrobeId);
  if (compError) throw compError;

  const componentsTotal = (components ?? []).reduce((sum, c) => sum + Number(c.qty) * Number(c.rate), 0);

  const breakdown = wardrobeCost({
    width: Number(row.width),
    height: Number(row.height),
    depth: Number(row.depth),
    shutterType: row.shutter_type,
    hingedRate: Number(row.hinged_rate),
    slidingRate: Number(row.sliding_rate),
    hasLoft: row.has_loft,
    loftHeight: Number(row.loft_height),
    loftRate: Number(row.loft_rate),
    componentsTotal,
    installLabourPct: Number(row.install_labour_pct),
  });
  const price = wardrobePrice(breakdown.cost, Number(row.margin_pct), Number(row.rounding_unit));

  const { error: updateError } = await supabase
    .from("wardrobes")
    .update({ material_cost: breakdown.material, total_cost: breakdown.cost, selling_price: price })
    .eq("id", wardrobeId);
  if (updateError) throw updateError;
}

function toRow(input: WardrobeInput) {
  return {
    name: input.name,
    room_id: input.roomId || null,
    width: input.width,
    height: input.height,
    depth: input.depth,
    shutter_type: input.shutterType,
    hinged_rate: input.hingedRate,
    sliding_rate: input.slidingRate,
    has_loft: input.hasLoft,
    loft_height: input.loftHeight,
    loft_rate: input.loftRate,
    install_labour_pct: input.installLabourPct / 100,
    margin_pct: input.marginPct / 100,
    rounding_unit: input.roundingUnit,
  };
}

export async function createWardrobe(projectId: string, input: WardrobeInput): Promise<ActionResult<{ id: string }>> {
  const parsed = wardrobeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wardrobes")
    .insert({ organization_id: ctx.organizationId, project_id: projectId, ...toRow(parsed.data) })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await recomputeWardrobe(data.id);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: { id: data.id } };
}

export async function updateWardrobe(
  wardrobeId: string,
  projectId: string,
  input: WardrobeInput
): Promise<ActionResult> {
  const parsed = wardrobeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("wardrobes")
    .update(toRow(parsed.data))
    .eq("id", wardrobeId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };

  await recomputeWardrobe(wardrobeId);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function deleteWardrobe(wardrobeId: string, projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("wardrobes")
    .delete()
    .eq("id", wardrobeId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function addWardrobeComponent(
  wardrobeId: string,
  projectId: string,
  input: WardrobeComponentInput
): Promise<ActionResult> {
  const parsed = wardrobeComponentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("wardrobe_components").insert({
    organization_id: ctx.organizationId,
    wardrobe_id: wardrobeId,
    component_name: parsed.data.componentName,
    qty: parsed.data.qty,
    rate: parsed.data.rate,
    amount: parsed.data.qty * parsed.data.rate,
  });
  if (error) return { error: error.message };

  await recomputeWardrobe(wardrobeId);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function removeWardrobeComponent(
  componentId: string,
  wardrobeId: string,
  projectId: string
): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("wardrobe_components")
    .delete()
    .eq("id", componentId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };

  await recomputeWardrobe(wardrobeId);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}
