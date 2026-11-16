"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { warrantySchema, type WarrantyInput } from "@/lib/validations/warranty";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: WarrantyInput) {
  return {
    project_id: input.projectId,
    item: input.item,
    handover_date: input.handoverDate,
    warranty_years: input.warrantyYears,
  };
}

export async function createWarranty(input: WarrantyInput): Promise<ActionResult<{ id: string }>> {
  const parsed = warrantySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("warranties")
    .insert({ organization_id: ctx.organizationId, ...toRow(parsed.data) })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/design-approval");
  return { error: null, data: { id: data.id } };
}

export async function updateWarranty(warrantyId: string, input: WarrantyInput): Promise<ActionResult> {
  const parsed = warrantySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("warranties")
    .update(toRow(parsed.data))
    .eq("id", warrantyId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/design-approval");
  return { error: null, data: undefined };
}
