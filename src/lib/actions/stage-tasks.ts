"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { stageTaskSchema, type StageTaskInput } from "@/lib/validations/stage-task";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: StageTaskInput) {
  return {
    project_id: input.projectId,
    stage: input.stage,
    task: input.task,
    done_by: input.doneBy || null,
    planned_date: input.plannedDate || null,
    done_on: input.doneOn || null,
  };
}

export async function createStageTask(input: StageTaskInput): Promise<ActionResult<{ id: string }>> {
  const parsed = stageTaskSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stage_tasks")
    .insert({ organization_id: ctx.organizationId, ...toRow(parsed.data) })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/site-tracker");
  return { error: null, data: { id: data.id } };
}

export async function updateStageTask(taskId: string, input: StageTaskInput): Promise<ActionResult> {
  const parsed = stageTaskSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("stage_tasks")
    .update(toRow(parsed.data))
    .eq("id", taskId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/site-tracker");
  return { error: null, data: undefined };
}
