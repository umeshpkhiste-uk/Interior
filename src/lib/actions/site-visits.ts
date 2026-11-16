"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { siteVisitSchema, type SiteVisitInput } from "@/lib/validations/site-visit";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: SiteVisitInput) {
  return {
    project_id: input.projectId,
    visit_date: input.visitDate,
    visited_by: input.visitedBy || null,
    purpose: input.purpose || null,
    work_done_pct: input.workDonePct != null ? input.workDonePct / 100 : null,
    notes: input.notes || null,
    next_visit_in_days: input.nextVisitInDays ?? null,
  };
}

export async function createSiteVisit(input: SiteVisitInput): Promise<ActionResult<{ id: string }>> {
  const parsed = siteVisitSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_visits")
    .insert({ organization_id: ctx.organizationId, ...toRow(parsed.data) })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/site-tracker");
  return { error: null, data: { id: data.id } };
}

export async function updateSiteVisit(visitId: string, input: SiteVisitInput): Promise<ActionResult> {
  const parsed = siteVisitSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_visits")
    .update(toRow(parsed.data))
    .eq("id", visitId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/site-tracker");
  return { error: null, data: undefined };
}
