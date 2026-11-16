"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { materialIssueSchema, type MaterialIssueInput } from "@/lib/validations/material-issue";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: MaterialIssueInput) {
  return {
    project_id: input.projectId,
    purchase_order_id: input.purchaseOrderId || null,
    issue_date: input.issueDate,
    item: input.item,
    unit: input.unit,
    qty: input.qty,
    rate: input.rate,
    issued_to: input.issuedTo || null,
  };
}

export async function createMaterialIssue(
  input: MaterialIssueInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = materialIssueSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("material_issues")
    .insert({ organization_id: ctx.organizationId, ...toRow(parsed.data) })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/material-purchase");
  return { error: null, data: { id: data.id } };
}

export async function updateMaterialIssue(
  issueId: string,
  input: MaterialIssueInput
): Promise<ActionResult> {
  const parsed = materialIssueSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("material_issues")
    .update(toRow(parsed.data))
    .eq("id", issueId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/material-purchase");
  return { error: null, data: undefined };
}
