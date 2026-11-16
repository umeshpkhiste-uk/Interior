"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { leadFollowupSchema, type LeadFollowupInput } from "@/lib/validations/lead-followup";
import type { ActionResult } from "@/lib/actions/clients";

export async function createLeadFollowup(input: LeadFollowupInput): Promise<ActionResult<{ id: string }>> {
  const parsed = leadFollowupSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("stage")
    .eq("id", parsed.data.leadId)
    .eq("organization_id", ctx.organizationId)
    .single();
  if (leadError) return { error: leadError.message };

  const { data, error } = await supabase
    .from("lead_followups")
    .insert({
      organization_id: ctx.organizationId,
      lead_id: parsed.data.leadId,
      followup_date: parsed.data.followupDate,
      channel: parsed.data.channel,
      handled_by: parsed.data.handledBy || null,
      outcome: parsed.data.outcome || null,
      stage_snapshot: lead.stage,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/leads");
  return { error: null, data: { id: data.id } };
}
