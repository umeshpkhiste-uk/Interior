"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { leadSchema, type LeadInput } from "@/lib/validations/lead";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: LeadInput) {
  return {
    enquiry_date: input.enquiryDate,
    client_name: input.clientName,
    phone: input.phone || null,
    area: input.area || null,
    source: input.source,
    property_type: input.propertyType || null,
    budget: input.budget ?? null,
    stage: input.stage,
    next_followup_date: input.nextFollowupDate || null,
    custom_1: input.custom1 || null,
    custom_2: input.custom2 || null,
    notes: input.notes || null,
  };
}

export async function createLead(input: LeadInput): Promise<ActionResult<{ id: string }>> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  const { data: leadCode, error: codeError } = await supabase.rpc("allocate_lead_code", {
    p_org_id: ctx.organizationId,
  });
  if (codeError) return { error: codeError.message };

  const { data, error } = await supabase
    .from("leads")
    .insert({ organization_id: ctx.organizationId, lead_code: leadCode, ...toRow(parsed.data) })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/leads");
  return { error: null, data: { id: data.id } };
}

export async function updateLead(leadId: string, input: LeadInput): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update(toRow(parsed.data))
    .eq("id", leadId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/leads");
  return { error: null, data: undefined };
}
