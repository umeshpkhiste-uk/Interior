"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { workerSchema, type WorkerInput } from "@/lib/validations/worker";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: WorkerInput) {
  return {
    name: input.name,
    trade: input.trade,
    daily_wage: input.dailyWage,
    phone: input.phone || null,
    team: input.team || null,
  };
}

export async function createWorker(input: WorkerInput): Promise<ActionResult<{ id: string }>> {
  const parsed = workerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  const { data: workerCode, error: codeError } = await supabase.rpc("allocate_worker_code", {
    p_org_id: ctx.organizationId,
  });
  if (codeError) return { error: codeError.message };

  const { data, error } = await supabase
    .from("workers")
    .insert({ organization_id: ctx.organizationId, worker_code: workerCode, ...toRow(parsed.data) })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/labour-payment");
  return { error: null, data: { id: data.id } };
}

export async function updateWorker(workerId: string, input: WorkerInput): Promise<ActionResult> {
  const parsed = workerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("workers")
    .update(toRow(parsed.data))
    .eq("id", workerId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath("/labour-payment");
  return { error: null, data: undefined };
}
