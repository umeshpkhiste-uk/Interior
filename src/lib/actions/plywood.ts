"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { computeCutListRow, plywoodCost, plywoodPrice, sheetsRequired } from "@/lib/calculations/plywood";
import {
  panelCutRowSchema,
  plywoodRateSchema,
  plywoodProjectSettingsSchema,
  type PanelCutRowInput,
  type PlywoodRateInput,
  type PlywoodProjectSettingsInput,
} from "@/lib/validations/plywood";
import type { ActionResult } from "@/lib/actions/clients";

const DEFAULT_LAMINATE_SHEET_LENGTH = 8;
const DEFAULT_LAMINATE_SHEET_WIDTH = 4;

/** Recomputes the project's whole plywood/laminate cost from the cut list + rates + settings. */
async function recomputePlywood(organizationId: string, projectId: string) {
  const supabase = await createClient();

  const [{ data: rows, error: rowsError }, { data: rates, error: ratesError }, { data: settings, error: settingsError }] =
    await Promise.all([
      supabase.from("panel_cut_lists").select("*").eq("organization_id", organizationId).eq("project_id", projectId),
      supabase.from("plywood_rates").select("*").eq("organization_id", organizationId),
      supabase
        .from("plywood_project_settings")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("project_id", projectId)
        .maybeSingle(),
    ]);
  if (rowsError) throw rowsError;
  if (ratesError) throw ratesError;
  if (settingsError) throw settingsError;
  if (!settings) return; // no settings row yet -> nothing to price

  const rateByGrade = new Map((rates ?? []).map((r) => [r.board_grade, r]));
  const areaByGrade = new Map<string, number>();
  let totalLaminateSqft = 0;
  let totalEdgeBandRft = 0;

  for (const row of rows ?? []) {
    const derived = computeCutListRow({
      qty: row.qty,
      lengthFt: Number(row.panel_length ?? 0),
      widthFt: Number(row.panel_width ?? 0),
      boardGrade: row.board_grade ?? "",
      laminateFaces: row.laminate_faces as 0 | 1 | 2,
      hasEdgeBand: row.has_edge_band,
    });
    const areaWithWastage = derived.area * (1 + Number(row.wastage_pct));
    areaByGrade.set(row.board_grade ?? "", (areaByGrade.get(row.board_grade ?? "") ?? 0) + areaWithWastage);
    totalLaminateSqft += derived.laminateSqft;
    totalEdgeBandRft += derived.edgeBandRft;
  }

  let boardCost = 0;
  for (const [grade, area] of areaByGrade) {
    const rate = rateByGrade.get(grade);
    if (!rate) continue; // unmatched board grade contributes no cost until a rate is added
    const sheets = sheetsRequired(area, 0, Number(rate.sheet_length), Number(rate.sheet_width));
    boardCost += sheets * Number(rate.rate_per_sheet);
  }

  const laminateSheets = sheetsRequired(totalLaminateSqft, 0, DEFAULT_LAMINATE_SHEET_LENGTH, DEFAULT_LAMINATE_SHEET_WIDTH);
  const breakdown = plywoodCost({
    boardCost,
    totalLaminateSqft,
    laminateSheets,
    laminateRatePerSheet: Number(settings.laminate_rate_per_sheet),
    totalEdgeBandRft,
    edgeBandRatePerRft: Number(settings.edge_band_rate_per_rft),
    fixingsPct: Number(settings.fixings_pct),
  });
  const price = plywoodPrice(breakdown.material, Number(settings.margin_pct), Number(settings.rounding_unit));

  const { error } = await supabase
    .from("plywood_project_settings")
    .update({ material_cost: breakdown.material, total_cost: breakdown.material, selling_price: price })
    .eq("project_id", projectId);
  if (error) throw error;
}

export async function saveCutListRow(
  projectId: string,
  input: PanelCutRowInput,
  rowId?: string
): Promise<ActionResult> {
  const parsed = panelCutRowSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const row = {
    panel_length: parsed.data.panelLength,
    panel_width: parsed.data.panelWidth,
    qty: parsed.data.qty,
    board_grade: parsed.data.boardGrade,
    plywood_thickness: parsed.data.plywoodThickness || null,
    laminate_type: parsed.data.laminateType || null,
    laminate_thickness: parsed.data.laminateThickness || null,
    laminate_faces: parsed.data.laminateFaces,
    has_edge_band: parsed.data.hasEdgeBand,
    wastage_pct: parsed.data.wastagePct / 100,
  };

  const { error } = rowId
    ? await supabase.from("panel_cut_lists").update(row).eq("id", rowId).eq("organization_id", ctx.organizationId)
    : await supabase.from("panel_cut_lists").insert({ organization_id: ctx.organizationId, project_id: projectId, ...row });
  if (error) return { error: error.message };

  await ensurePlywoodSettingsRow(ctx.organizationId, projectId);
  await recomputePlywood(ctx.organizationId, projectId);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function deleteCutListRow(rowId: string, projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("panel_cut_lists")
    .delete()
    .eq("id", rowId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };

  await recomputePlywood(ctx.organizationId, projectId);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function upsertPlywoodRate(input: PlywoodRateInput, rateId?: string): Promise<ActionResult> {
  const parsed = plywoodRateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const row = {
    board_grade: parsed.data.boardGrade,
    rate_per_sheet: parsed.data.ratePerSheet,
    sheet_length: parsed.data.sheetLength,
    sheet_width: parsed.data.sheetWidth,
  };
  const { error } = rateId
    ? await supabase.from("plywood_rates").update(row).eq("id", rateId).eq("organization_id", ctx.organizationId)
    : await supabase.from("plywood_rates").insert({ organization_id: ctx.organizationId, ...row });
  if (error) return { error: error.message };
  revalidatePath("/materials");
  return { error: null, data: undefined };
}

export async function deletePlywoodRate(rateId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("plywood_rates")
    .delete()
    .eq("id", rateId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  return { error: null, data: undefined };
}

async function ensurePlywoodSettingsRow(organizationId: string, projectId: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("plywood_project_settings")
    .select("project_id")
    .eq("project_id", projectId)
    .maybeSingle();
  if (!existing) {
    await supabase.from("plywood_project_settings").insert({ organization_id: organizationId, project_id: projectId });
  }
}

export async function savePlywoodProjectSettings(
  projectId: string,
  input: PlywoodProjectSettingsInput
): Promise<ActionResult> {
  const parsed = plywoodProjectSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  await ensurePlywoodSettingsRow(ctx.organizationId, projectId);

  const { error } = await supabase
    .from("plywood_project_settings")
    .update({
      laminate_rate_per_sheet: parsed.data.laminateRatePerSheet,
      edge_band_rate_per_rft: parsed.data.edgeBandRatePerRft,
      fixings_pct: parsed.data.fixingsPct / 100,
      margin_pct: parsed.data.marginPct / 100,
      rounding_unit: parsed.data.roundingUnit,
    })
    .eq("project_id", projectId);
  if (error) return { error: error.message };

  await recomputePlywood(ctx.organizationId, projectId);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}
