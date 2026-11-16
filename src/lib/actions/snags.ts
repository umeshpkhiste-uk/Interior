"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { snagSchema, type SnagInput } from "@/lib/validations/snag";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: SnagInput) {
  return {
    project_id: input.projectId,
    room_area: input.roomArea || null,
    item: input.item,
    issue: input.issue,
    found_on: input.foundOn,
    assigned_to: input.assignedTo || null,
    fix_by: input.fixBy || null,
    fixed_on: input.fixedOn || null,
  };
}

export async function createSnag(input: SnagInput): Promise<ActionResult<{ id: string }>> {
  const parsed = snagSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  const { data: snagCode, error: codeError } = await supabase.rpc("allocate_snag_code", {
    p_org_id: ctx.organizationId,
  });
  if (codeError) return { error: codeError.message };

  const { data, error } = await supabase
    .from("snags")
    .insert({ organization_id: ctx.organizationId, snag_code: snagCode, ...toRow(parsed.data) })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/design-approval");
  return { error: null, data: { id: data.id } };
}

export async function updateSnag(snagId: string, input: SnagInput): Promise<ActionResult> {
  const parsed = snagSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("snags")
    .update(toRow(parsed.data))
    .eq("id", snagId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/design-approval");
  return { error: null, data: undefined };
}
