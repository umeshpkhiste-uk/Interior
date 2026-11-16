"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { labourWeeklyPaymentSchema, type LabourWeeklyPaymentInput } from "@/lib/validations/labour-weekly-payment";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: LabourWeeklyPaymentInput) {
  return {
    worker_id: input.workerId,
    week_starting: input.weekStarting,
    advance_recovered: input.advanceRecovered,
    paid: input.paid,
    mode: input.mode,
  };
}

export async function createLabourWeeklyPayment(input: LabourWeeklyPaymentInput): Promise<ActionResult<{ id: string }>> {
  const parsed = labourWeeklyPaymentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("labour_weekly_payments")
    .insert({ organization_id: ctx.organizationId, ...toRow(parsed.data) })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/labour-payment");
  return { error: null, data: { id: data.id } };
}

export async function updateLabourWeeklyPayment(paymentId: string, input: LabourWeeklyPaymentInput): Promise<ActionResult> {
  const parsed = labourWeeklyPaymentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("labour_weekly_payments")
    .update(toRow(parsed.data))
    .eq("id", paymentId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath("/labour-payment");
  return { error: null, data: undefined };
}
