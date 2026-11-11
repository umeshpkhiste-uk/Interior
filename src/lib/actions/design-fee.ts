"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { getLatestTaxableAmount } from "@/lib/data/quotations";
import { computeBoqTotals } from "@/lib/calculations/boq";
import { computeDesignFee } from "@/lib/calculations/design-fee";
import { designFeeSchema, designFeeStageSchema, type DesignFeeInput, type DesignFeeStageInput } from "@/lib/validations/design-fee";
import type { ActionResult } from "@/lib/actions/clients";

/** Project value per mapping doc decision #12: latest quotation's taxable amount, else live BOQ subtotal pre-GST. */
async function resolveProjectValue(organizationId: string, projectId: string): Promise<number> {
  const taxable = await getLatestTaxableAmount(organizationId, projectId);
  if (taxable !== null) return taxable;

  const supabase = await createClient();
  const [{ data: boqItems }, { data: settings }] = await Promise.all([
    supabase.from("boq_items").select("amount").eq("organization_id", organizationId).eq("project_id", projectId),
    supabase.from("project_boq_settings").select("contingency_pct").eq("project_id", projectId).maybeSingle(),
  ]);
  const totals = computeBoqTotals(boqItems ?? [], Number(settings?.contingency_pct ?? 0.05), 0, null);
  return totals.beforeGst;
}

async function recomputeDesignFee(designFeeId: string) {
  const supabase = await createClient();
  const { data: fee, error } = await supabase.from("design_fees").select("*, projects(carpet_area)").eq("id", designFeeId).single();
  if (error) throw error;

  const projectValue = await resolveProjectValue(fee.organization_id, fee.project_id);
  const carpetArea = Number((fee as unknown as { projects: { carpet_area: number | null } }).projects?.carpet_area ?? 0);

  const breakdown = computeDesignFee({
    basis: fee.basis,
    projectValue,
    feePct: Number(fee.fee_pct),
    carpetArea,
    feePerSqft: Number(fee.fee_per_sqft),
    fixedFee: Number(fee.fixed_fee),
    additionalVisits: fee.additional_visits,
    additionalVisitRate: Number(fee.additional_visit_rate),
    gstPct: Number(fee.gst_pct),
  });

  const { error: updateError } = await supabase
    .from("design_fees")
    .update({
      design_fee_amount: breakdown.designFeeAmount,
      extra_visit_amount: breakdown.extraVisitAmount,
      total_before_gst: breakdown.totalBeforeGst,
      total_with_gst: breakdown.totalWithGst,
    })
    .eq("id", designFeeId);
  if (updateError) throw updateError;

  const { data: stages } = await supabase.from("design_fee_stages").select("id, stage_pct").eq("design_fee_id", designFeeId);
  for (const stage of stages ?? []) {
    await supabase
      .from("design_fee_stages")
      .update({ stage_amount: breakdown.totalWithGst * Number(stage.stage_pct ?? 0) })
      .eq("id", stage.id);
  }
}

export async function saveDesignFee(projectId: string, input: DesignFeeInput): Promise<ActionResult<{ id: string }>> {
  const parsed = designFeeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const v = parsed.data;
  const row = {
    basis: v.basis,
    fee_pct: v.feePct / 100,
    fee_per_sqft: v.feePerSqft,
    fixed_fee: v.fixedFee,
    included_visits: v.includedVisits,
    additional_visits: v.additionalVisits,
    additional_visit_rate: v.additionalVisitRate,
    gst_pct: v.gstPct / 100,
  };

  const { data: existing } = await supabase
    .from("design_fees")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .maybeSingle();

  let id: string;
  if (existing) {
    const { error } = await supabase.from("design_fees").update(row).eq("id", existing.id);
    if (error) return { error: error.message };
    id = existing.id;
  } else {
    const { data, error } = await supabase
      .from("design_fees")
      .insert({ organization_id: ctx.organizationId, project_id: projectId, ...row })
      .select("id")
      .single();
    if (error) return { error: error.message };
    id = data.id;
  }

  await recomputeDesignFee(id);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: { id } };
}

export async function addDesignFeeStage(designFeeId: string, projectId: string, input: DesignFeeStageInput): Promise<ActionResult> {
  const parsed = designFeeStageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data: fee } = await supabase.from("design_fees").select("total_with_gst").eq("id", designFeeId).single();
  const stagePct = parsed.data.stagePct / 100;
  const { error } = await supabase.from("design_fee_stages").insert({
    organization_id: ctx.organizationId,
    design_fee_id: designFeeId,
    stage_name: parsed.data.stageName,
    stage_pct: stagePct,
    stage_amount: Number(fee?.total_with_gst ?? 0) * stagePct,
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function deleteDesignFeeStage(stageId: string, projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("design_fee_stages").delete().eq("id", stageId).eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}
