"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { electricalCost, electricalPrice, roomPointsCost } from "@/lib/calculations/electrical";
import {
  electricalPointSchema,
  electricalProjectSettingsSchema,
  type ElectricalPointInput,
  type ElectricalProjectSettingsInput,
} from "@/lib/validations/electrical";
import type { ActionResult } from "@/lib/actions/clients";

async function ensureSettingsRow(organizationId: string, projectId: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("electrical_project_settings")
    .select("project_id")
    .eq("project_id", projectId)
    .maybeSingle();
  if (!existing) {
    await supabase.from("electrical_project_settings").insert({ organization_id: organizationId, project_id: projectId });
  }
}

async function recomputeElectrical(organizationId: string, projectId: string) {
  const supabase = await createClient();
  const { data: rooms, error: roomsError } = await supabase
    .from("project_rooms")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId);
  if (roomsError) throw roomsError;

  const { data: points, error: pointsError } = await supabase
    .from("electrical_estimations")
    .select("qty, all_in_rate")
    .eq("organization_id", organizationId)
    .in("room_id", (rooms ?? []).map((r) => r.id));
  if (pointsError) throw pointsError;

  const { data: settings, error: settingsError } = await supabase
    .from("electrical_project_settings")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  if (settingsError) throw settingsError;
  if (!settings) return;

  const totalPointsCost = roomPointsCost((points ?? []).map((p) => ({ qty: Number(p.qty), allInRate: Number(p.all_in_rate) })));
  const breakdown = electricalCost({
    totalPointsCost,
    dbMcbCost: Number(settings.db_mcb_cost),
    labourSharePct: Number(settings.labour_share_pct),
  });
  const price = electricalPrice(breakdown.cost, Number(settings.margin_pct), Number(settings.rounding_unit));

  const { error } = await supabase
    .from("electrical_project_settings")
    .update({ material_cost: breakdown.material, total_cost: breakdown.cost, selling_price: price })
    .eq("project_id", projectId);
  if (error) throw error;
}

export async function addElectricalPoint(
  roomId: string,
  projectId: string,
  input: ElectricalPointInput
): Promise<ActionResult> {
  const parsed = electricalPointSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("electrical_estimations").insert({
    organization_id: ctx.organizationId,
    room_id: roomId,
    point_type: parsed.data.pointType,
    qty: parsed.data.qty,
    all_in_rate: parsed.data.allInRate,
    wiring_spec: parsed.data.wiringSpec || null,
    amount: parsed.data.qty * parsed.data.allInRate,
  });
  if (error) return { error: error.message };

  await ensureSettingsRow(ctx.organizationId, projectId);
  await recomputeElectrical(ctx.organizationId, projectId);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function removeElectricalPoint(pointId: string, projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("electrical_estimations")
    .delete()
    .eq("id", pointId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };

  await recomputeElectrical(ctx.organizationId, projectId);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function saveElectricalProjectSettings(
  projectId: string,
  input: ElectricalProjectSettingsInput
): Promise<ActionResult> {
  const parsed = electricalProjectSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  await ensureSettingsRow(ctx.organizationId, projectId);

  const { error } = await supabase
    .from("electrical_project_settings")
    .update({
      db_mcb_cost: parsed.data.dbMcbCost,
      labour_share_pct: parsed.data.labourSharePct / 100,
      margin_pct: parsed.data.marginPct / 100,
      rounding_unit: parsed.data.roundingUnit,
    })
    .eq("project_id", projectId);
  if (error) return { error: error.message };

  await recomputeElectrical(ctx.organizationId, projectId);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}
