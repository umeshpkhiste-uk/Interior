"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { clientApprovalSchema, type ClientApprovalInput } from "@/lib/validations/client-approval";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: ClientApprovalInput) {
  return {
    project_id: input.projectId,
    approval_for: input.approvalFor,
    room_area: input.roomArea || null,
    sent_on: input.sentOn,
    approved_on: input.approvedOn || null,
    approved_by: input.approvedBy || null,
    channel: input.channel || null,
  };
}

export async function createClientApproval(
  input: ClientApprovalInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = clientApprovalSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_approvals")
    .insert({ organization_id: ctx.organizationId, ...toRow(parsed.data) })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/design-approval");
  return { error: null, data: { id: data.id } };
}

export async function updateClientApproval(
  approvalId: string,
  input: ClientApprovalInput
): Promise<ActionResult> {
  const parsed = clientApprovalSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("client_approvals")
    .update(toRow(parsed.data))
    .eq("id", approvalId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/design-approval");
  return { error: null, data: undefined };
}
