"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { handoverCheckSchema, type HandoverCheckInput } from "@/lib/validations/handover-check";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: HandoverCheckInput) {
  return {
    project_id: input.projectId,
    room_area: input.roomArea || null,
    check_item: input.checkItem,
    checked_by: input.checkedBy || null,
    checked_on: input.checkedOn || null,
    result: input.result || null,
  };
}

export async function createHandoverCheck(
  input: HandoverCheckInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = handoverCheckSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("handover_checks")
    .insert({ organization_id: ctx.organizationId, ...toRow(parsed.data) })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/design-approval");
  return { error: null, data: { id: data.id } };
}

export async function updateHandoverCheck(
  checkId: string,
  input: HandoverCheckInput
): Promise<ActionResult> {
  const parsed = handoverCheckSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("handover_checks")
    .update(toRow(parsed.data))
    .eq("id", checkId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/design-approval");
  return { error: null, data: undefined };
}
