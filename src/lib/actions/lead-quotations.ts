"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { leadQuotationSchema, type LeadQuotationInput } from "@/lib/validations/lead-quotation";
import type { ActionResult } from "@/lib/actions/clients";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/** An accepted quotation that is still the latest one for its lead wins the lead, per the source sheet's rule. */
async function syncLeadStageFromLatestQuote(supabase: SupabaseClient, organizationId: string, leadId: string) {
  const { data: latest } = await supabase
    .from("lead_quotations")
    .select("status")
    .eq("organization_id", organizationId)
    .eq("lead_id", leadId)
    .order("quote_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest?.status === "accepted") {
    await supabase
      .from("leads")
      .update({ stage: "won" })
      .eq("id", leadId)
      .eq("organization_id", organizationId);
  }
}

export async function createLeadQuotation(
  input: LeadQuotationInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = leadQuotationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  const { data: quoteNumber, error: numberError } = await supabase.rpc("allocate_lead_quote_number", {
    p_org_id: ctx.organizationId,
  });
  if (numberError) return { error: numberError.message };

  const { data, error } = await supabase
    .from("lead_quotations")
    .insert({
      organization_id: ctx.organizationId,
      lead_id: parsed.data.leadId,
      quote_number: quoteNumber,
      quote_date: parsed.data.quoteDate,
      quoted_amount: parsed.data.quotedAmount,
      discount_pct: parsed.data.discountPct / 100,
      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  await syncLeadStageFromLatestQuote(supabase, ctx.organizationId, parsed.data.leadId);
  revalidatePath("/leads");
  return { error: null, data: { id: data.id } };
}

export async function updateLeadQuotationStatus(
  quotationId: string,
  status: LeadQuotationInput["status"]
): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lead_quotations")
    .update({ status })
    .eq("id", quotationId)
    .eq("organization_id", ctx.organizationId)
    .select("lead_id")
    .single();

  if (error) return { error: error.message };
  await syncLeadStageFromLatestQuote(supabase, ctx.organizationId, data.lead_id);
  revalidatePath("/leads");
  return { error: null, data: undefined };
}
