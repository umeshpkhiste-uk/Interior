"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { labourAdvanceSchema, type LabourAdvanceInput } from "@/lib/validations/labour-advance";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: LabourAdvanceInput) {
  return {
    worker_id: input.workerId,
    advance_date: input.advanceDate,
    amount: input.amount,
    reason: input.reason || null,
  };
}

export async function createLabourAdvance(input: LabourAdvanceInput): Promise<ActionResult<{ id: string }>> {
  const parsed = labourAdvanceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("labour_advances")
    .insert({ organization_id: ctx.organizationId, ...toRow(parsed.data) })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/labour-payment");
  return { error: null, data: { id: data.id } };
}

export async function updateLabourAdvance(advanceId: string, input: LabourAdvanceInput): Promise<ActionResult> {
  const parsed = labourAdvanceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("labour_advances")
    .update(toRow(parsed.data))
    .eq("id", advanceId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath("/labour-payment");
  return { error: null, data: undefined };
}
