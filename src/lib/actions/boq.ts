"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { boqItemSchema, boqSettingsSchema, type BoqItemInput, type BoqSettingsInput } from "@/lib/validations/boq";
import type { ActionResult } from "@/lib/actions/clients";
import type { Database } from "@/lib/supabase/types";

type SourceModule = Database["public"]["Enums"]["boq_source_module"];

interface SyncRow {
  source_module: SourceModule;
  source_estimation_id: string;
  room_id: string | null;
  work_category: string;
  item_description: string;
  unit: string;
  quantity: number;
  total_rate: number;
  amount: number;
  is_manual: false;
}

/**
 * Rebuilds every auto-synced BOQ line from the 7 estimator modules, keyed
 * on (project_id, source_module, source_estimation_id) so re-running this
 * never duplicates a row (mapping doc decision #7) — upserts the current
 * set, then removes any previously-synced row whose source no longer
 * exists (e.g. a wardrobe that was deleted).
 */
export async function syncBoqFromEstimators(projectId: string): Promise<ActionResult<{ count: number }>> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const orgId = ctx.organizationId;

  const [rooms, kitchen, wardrobes, plywood, ceilings, paints, floorings, electrical] = await Promise.all([
    supabase.from("project_rooms").select("id, room_name").eq("organization_id", orgId).eq("project_id", projectId),
    supabase.from("kitchen_estimations").select("id, selling_price").eq("organization_id", orgId).eq("project_id", projectId).maybeSingle(),
    supabase.from("wardrobes").select("id, name, room_id, selling_price").eq("organization_id", orgId).eq("project_id", projectId),
    supabase.from("plywood_project_settings").select("project_id, selling_price").eq("organization_id", orgId).eq("project_id", projectId).maybeSingle(),
    supabase.from("ceiling_estimations").select("id, room_id, selling_price").eq("organization_id", orgId),
    supabase.from("paint_estimations").select("id, room_id, selling_price").eq("organization_id", orgId).eq("project_id", projectId),
    supabase.from("flooring_estimations").select("id, room_id, selling_price").eq("organization_id", orgId),
    supabase.from("electrical_project_settings").select("project_id, selling_price").eq("organization_id", orgId).eq("project_id", projectId).maybeSingle(),
  ]);
  for (const r of [rooms, wardrobes, ceilings, paints, floorings]) if (r.error) return { error: r.error.message };
  if (kitchen.error) return { error: kitchen.error.message };
  if (plywood.error) return { error: plywood.error.message };
  if (electrical.error) return { error: electrical.error.message };

  const roomIds = new Set((rooms.data ?? []).map((r) => r.id));
  const roomNameById = new Map((rooms.data ?? []).map((r) => [r.id, r.room_name]));
  const ceilingsForProject = (ceilings.data ?? []).filter((c) => roomIds.has(c.room_id));
  const flooringsForProject = (floorings.data ?? []).filter((f) => roomIds.has(f.room_id));

  const rows: SyncRow[] = [];

  if (kitchen.data && Number(kitchen.data.selling_price) > 0) {
    rows.push({
      source_module: "kitchen", source_estimation_id: kitchen.data.id, room_id: null,
      work_category: "Kitchen", item_description: "Modular Kitchen", unit: "lot",
      quantity: 1, total_rate: Number(kitchen.data.selling_price), amount: Number(kitchen.data.selling_price), is_manual: false,
    });
  }

  for (const w of wardrobes.data ?? []) {
    if (Number(w.selling_price) <= 0) continue;
    rows.push({
      source_module: "wardrobe", source_estimation_id: w.id, room_id: w.room_id,
      work_category: "Wardrobe", item_description: w.name, unit: "lot",
      quantity: 1, total_rate: Number(w.selling_price), amount: Number(w.selling_price), is_manual: false,
    });
  }

  if (plywood.data && Number(plywood.data.selling_price) > 0) {
    rows.push({
      source_module: "plywood", source_estimation_id: plywood.data.project_id, room_id: null,
      work_category: "Plywood & Laminate", item_description: "Plywood & Laminate", unit: "lot",
      quantity: 1, total_rate: Number(plywood.data.selling_price), amount: Number(plywood.data.selling_price), is_manual: false,
    });
  }

  for (const c of ceilingsForProject) {
    if (Number(c.selling_price) <= 0) continue;
    const roomName = roomNameById.get(c.room_id) ?? "Room";
    rows.push({
      source_module: "ceiling", source_estimation_id: c.id, room_id: c.room_id,
      work_category: "False Ceiling", item_description: `False Ceiling - ${roomName}`, unit: "lot",
      quantity: 1, total_rate: Number(c.selling_price), amount: Number(c.selling_price), is_manual: false,
    });
  }

  for (const p of paints.data ?? []) {
    if (Number(p.selling_price) <= 0) continue;
    const roomName = p.room_id ? roomNameById.get(p.room_id) ?? "Room" : "Whole Project";
    rows.push({
      source_module: "paint", source_estimation_id: p.id, room_id: p.room_id,
      work_category: "Paint & Wallpaper", item_description: `Paint & Wallpaper - ${roomName}`, unit: "lot",
      quantity: 1, total_rate: Number(p.selling_price), amount: Number(p.selling_price), is_manual: false,
    });
  }

  for (const f of flooringsForProject) {
    if (Number(f.selling_price) <= 0) continue;
    const roomName = roomNameById.get(f.room_id) ?? "Room";
    rows.push({
      source_module: "flooring", source_estimation_id: f.id, room_id: f.room_id,
      work_category: "Flooring", item_description: `Flooring - ${roomName}`, unit: "lot",
      quantity: 1, total_rate: Number(f.selling_price), amount: Number(f.selling_price), is_manual: false,
    });
  }

  if (electrical.data && Number(electrical.data.selling_price) > 0) {
    rows.push({
      source_module: "electrical", source_estimation_id: electrical.data.project_id, room_id: null,
      work_category: "Electrical & Lighting", item_description: "Electrical & Lighting", unit: "lot",
      quantity: 1, total_rate: Number(electrical.data.selling_price), amount: Number(electrical.data.selling_price), is_manual: false,
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase
      .from("boq_items")
      .upsert(
        rows.map((r) => ({ organization_id: orgId, project_id: projectId, material_rate: r.total_rate, labour_rate: 0, ...r })),
        { onConflict: "project_id,source_module,source_estimation_id" }
      );
    if (error) return { error: error.message };
  }

  // Remove previously-synced rows whose source no longer exists.
  const { data: existingSynced, error: existingError } = await supabase
    .from("boq_items")
    .select("id, source_module, source_estimation_id")
    .eq("organization_id", orgId)
    .eq("project_id", projectId)
    .not("source_module", "is", null);
  if (existingError) return { error: existingError.message };

  const desiredKeys = new Set(rows.map((r) => `${r.source_module}:${r.source_estimation_id}`));
  const staleIds = (existingSynced ?? [])
    .filter((e) => !desiredKeys.has(`${e.source_module}:${e.source_estimation_id}`))
    .map((e) => e.id);
  if (staleIds.length > 0) {
    const { error } = await supabase.from("boq_items").delete().in("id", staleIds);
    if (error) return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: { count: rows.length } };
}

export async function addManualBoqItem(projectId: string, input: BoqItemInput): Promise<ActionResult> {
  const parsed = boqItemSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const v = parsed.data;
  const totalRate = v.materialRate + v.labourRate;
  const { error } = await supabase.from("boq_items").insert({
    organization_id: ctx.organizationId,
    project_id: projectId,
    room_id: v.roomId || null,
    work_category: v.workCategory || null,
    item_description: v.itemDescription,
    specification: v.specification || null,
    brand: v.brand || null,
    unit: v.unit || null,
    quantity: v.quantity,
    material_rate: v.materialRate,
    labour_rate: v.labourRate,
    total_rate: totalRate,
    amount: v.quantity * totalRate,
    is_manual: true,
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function updateManualBoqItem(itemId: string, projectId: string, input: BoqItemInput): Promise<ActionResult> {
  const parsed = boqItemSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const v = parsed.data;
  const totalRate = v.materialRate + v.labourRate;
  const { error } = await supabase
    .from("boq_items")
    .update({
      room_id: v.roomId || null,
      work_category: v.workCategory || null,
      item_description: v.itemDescription,
      specification: v.specification || null,
      brand: v.brand || null,
      unit: v.unit || null,
      quantity: v.quantity,
      material_rate: v.materialRate,
      labour_rate: v.labourRate,
      total_rate: totalRate,
      amount: v.quantity * totalRate,
    })
    .eq("id", itemId)
    .eq("organization_id", ctx.organizationId)
    .eq("is_manual", true);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function deleteBoqItem(itemId: string, projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("boq_items").delete().eq("id", itemId).eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function saveBoqSettings(projectId: string, input: BoqSettingsInput): Promise<ActionResult> {
  const parsed = boqSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const row = { contingency_pct: parsed.data.contingencyPct / 100, gst_pct: parsed.data.gstPct / 100 };

  const { data: existing } = await supabase
    .from("project_boq_settings")
    .select("project_id")
    .eq("project_id", projectId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("project_boq_settings").update(row).eq("project_id", projectId)
    : await supabase.from("project_boq_settings").insert({ organization_id: ctx.organizationId, project_id: projectId, ...row });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}
