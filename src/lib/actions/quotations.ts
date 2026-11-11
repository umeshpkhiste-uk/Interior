"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { boqSubtotal } from "@/lib/calculations/boq";
import { computeQuotationTotals } from "@/lib/calculations/quotation";
import {
  quotationSettingsSchema,
  quotationItemSchema,
  paymentStageSchema,
  type QuotationSettingsInput,
  type QuotationItemInput,
  type PaymentStageInput,
} from "@/lib/validations/quotation";
import type { ActionResult } from "@/lib/actions/clients";

async function recomputeQuotation(quotationId: string) {
  const supabase = await createClient();
  const { data: quotation, error } = await supabase.from("quotations").select("*").eq("id", quotationId).single();
  if (error) throw error;
  if (quotation.status !== "draft") return; // decision #9: never recompute a sent quotation

  const { data: boqItems, error: boqError } = await supabase
    .from("boq_items")
    .select("amount")
    .eq("project_id", quotation.project_id);
  if (boqError) throw boqError;

  const { data: boqSettings } = await supabase
    .from("project_boq_settings")
    .select("contingency_pct")
    .eq("project_id", quotation.project_id)
    .maybeSingle();

  const { data: extraItems, error: itemsError } = await supabase
    .from("quotation_items")
    .select("amount")
    .eq("quotation_id", quotationId);
  if (itemsError) throw itemsError;

  const roomsTotal = boqSubtotal(boqItems ?? []);
  const extraItemsTotal = boqSubtotal(extraItems ?? []);
  const totals = computeQuotationTotals({
    roomsTotal,
    contingencyPct: Number(boqSettings?.contingency_pct ?? 0.05),
    extraItemsTotal,
    discountType: quotation.discount_type,
    discountValue: quotation.discount_type === "percent" ? Number(quotation.discount_value) / 100 : Number(quotation.discount_value),
    gstPct: Number(quotation.gst_pct),
  });

  const { error: updateError } = await supabase
    .from("quotations")
    .update({
      subtotal: roomsTotal,
      contingency_amount: totals.contingencyAmount,
      gross_amount: totals.grossAmount,
      discount_amount: totals.discountAmount,
      taxable_amount: totals.taxableAmount,
      gst_amount: totals.gstAmount,
      round_off: totals.roundOff,
      grand_total: totals.grandTotal,
    })
    .eq("id", quotationId);
  if (updateError) throw updateError;

  // Keep payment stage amounts in sync with the recomputed grand total.
  const { data: stages } = await supabase.from("quotation_payment_stages").select("id, stage_pct").eq("quotation_id", quotationId);
  for (const stage of stages ?? []) {
    await supabase
      .from("quotation_payment_stages")
      .update({ stage_amount: totals.grandTotal * Number(stage.stage_pct ?? 0) })
      .eq("id", stage.id);
  }
}

export async function createQuotationDraft(projectId: string): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  const { data: quotationNumber, error: numberError } = await supabase.rpc("allocate_quotation_number", {
    p_org_id: ctx.organizationId,
  });
  if (numberError) return { error: numberError.message };

  const { data: org } = await supabase.from("organizations").select("default_gst_pct").eq("id", ctx.organizationId).single();

  const { data, error } = await supabase
    .from("quotations")
    .insert({
      organization_id: ctx.organizationId,
      project_id: projectId,
      quotation_number: quotationNumber,
      status: "draft",
      discount_type: "percent",
      discount_value: 0,
      gst_pct: org?.default_gst_pct ?? 0.18,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await recomputeQuotation(data.id);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: { id: data.id } };
}

export async function updateQuotationSettings(
  quotationId: string,
  projectId: string,
  input: QuotationSettingsInput
): Promise<ActionResult> {
  const parsed = quotationSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotations")
    .update({
      validity_date: parsed.data.validityDate || null,
      discount_type: parsed.data.discountType,
      discount_value: parsed.data.discountValue,
      gst_pct: parsed.data.gstPct / 100,
    })
    .eq("id", quotationId)
    .eq("organization_id", ctx.organizationId)
    .eq("status", "draft");
  if (error) return { error: error.message };

  await recomputeQuotation(quotationId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/quotations/${quotationId}`);
  return { error: null, data: undefined };
}

export async function addQuotationItem(
  quotationId: string,
  projectId: string,
  input: QuotationItemInput
): Promise<ActionResult> {
  const parsed = quotationItemSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("quotation_items").insert({
    organization_id: ctx.organizationId,
    quotation_id: quotationId,
    room_label: parsed.data.roomLabel || null,
    item_description: parsed.data.itemDescription,
    specification: parsed.data.specification || null,
    unit: parsed.data.unit || null,
    quantity: parsed.data.quantity,
    rate: parsed.data.rate,
    amount: parsed.data.quantity * parsed.data.rate,
  });
  if (error) return { error: error.message };

  await recomputeQuotation(quotationId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/quotations/${quotationId}`);
  return { error: null, data: undefined };
}

export async function deleteQuotationItem(itemId: string, quotationId: string, projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("quotation_items").delete().eq("id", itemId).eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };

  await recomputeQuotation(quotationId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/quotations/${quotationId}`);
  return { error: null, data: undefined };
}

export async function addPaymentStage(quotationId: string, projectId: string, input: PaymentStageInput): Promise<ActionResult> {
  const parsed = paymentStageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data: quotation } = await supabase.from("quotations").select("grand_total").eq("id", quotationId).single();
  const stagePct = parsed.data.stagePct / 100;
  const { error } = await supabase.from("quotation_payment_stages").insert({
    organization_id: ctx.organizationId,
    quotation_id: quotationId,
    stage_name: parsed.data.stageName,
    stage_pct: stagePct,
    stage_amount: Number(quotation?.grand_total ?? 0) * stagePct,
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/quotations/${quotationId}`);
  return { error: null, data: undefined };
}

export async function deletePaymentStage(stageId: string, quotationId: string, projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("quotation_payment_stages").delete().eq("id", stageId).eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/quotations/${quotationId}`);
  return { error: null, data: undefined };
}

/**
 * Sends the quotation: freezes an immutable JSON snapshot of every rate,
 * percentage, and line item at this moment (mapping doc decision #9 —
 * non-negotiable per the master prompt). After this, recomputeQuotation()
 * refuses to touch the row, and quotation_snapshots has no update/delete
 * policy at all.
 */
export async function sendQuotation(quotationId: string, projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  await recomputeQuotation(quotationId);

  const { data: quotation, error: qError } = await supabase.from("quotations").select("*").eq("id", quotationId).single();
  if (qError) return { error: qError.message };
  if (quotation.status !== "draft") return { error: "Only a draft quotation can be sent." };

  const [{ data: items }, { data: stages }, { data: boqItems }, { data: boqSettings }] = await Promise.all([
    supabase.from("quotation_items").select("*").eq("quotation_id", quotationId),
    supabase.from("quotation_payment_stages").select("*").eq("quotation_id", quotationId),
    supabase.from("boq_items").select("*").eq("project_id", projectId),
    supabase.from("project_boq_settings").select("*").eq("project_id", projectId).maybeSingle(),
  ]);

  const { error: snapshotError } = await supabase.from("quotation_snapshots").insert({
    organization_id: ctx.organizationId,
    quotation_id: quotationId,
    snapshot: { quotation, items, paymentStages: stages, boqItems, boqSettings, snapshotTakenAt: new Date().toISOString() },
  });
  if (snapshotError) return { error: snapshotError.message };

  const { error: updateError } = await supabase
    .from("quotations")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", quotationId);
  if (updateError) return { error: updateError.message };

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/quotations/${quotationId}`);
  return { error: null, data: undefined };
}

export async function setQuotationStatus(
  quotationId: string,
  projectId: string,
  status: "approved" | "rejected" | "expired" | "viewed"
): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotations")
    .update(status === "approved" ? { status, approved_at: new Date().toISOString() } : { status })
    .eq("id", quotationId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/quotations/${quotationId}`);
  return { error: null, data: undefined };
}

export async function deleteQuotationDraft(quotationId: string, projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotations")
    .delete()
    .eq("id", quotationId)
    .eq("organization_id", ctx.organizationId)
    .eq("status", "draft");
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}
