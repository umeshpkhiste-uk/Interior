"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { designRevisionSchema, type DesignRevisionInput } from "@/lib/validations/design-revision";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: DesignRevisionInput) {
  return {
    project_id: input.projectId,
    room_area: input.roomArea || null,
    drawing: input.drawing,
    version: input.version,
    client_asked_for: input.clientAskedFor || null,
    sent_on: input.sentOn,
    reply_on: input.replyOn || null,
    reply_status: input.replyStatus,
  };
}

export async function createDesignRevision(
  input: DesignRevisionInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = designRevisionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  const { data: revisionCode, error: codeError } = await supabase.rpc("allocate_design_revision_code", {
    p_org_id: ctx.organizationId,
  });
  if (codeError) return { error: codeError.message };

  const { data, error } = await supabase
    .from("design_revisions")
    .insert({ organization_id: ctx.organizationId, revision_code: revisionCode, ...toRow(parsed.data) })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/design-approval");
  return { error: null, data: { id: data.id } };
}

export async function updateDesignRevision(
  revisionId: string,
  input: DesignRevisionInput
): Promise<ActionResult> {
  const parsed = designRevisionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("design_revisions")
    .update(toRow(parsed.data))
    .eq("id", revisionId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/design-approval");
  return { error: null, data: undefined };
}
