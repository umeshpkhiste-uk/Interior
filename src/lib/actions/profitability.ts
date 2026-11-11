"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { projectSettingsSchema, type ProjectSettingsInput } from "@/lib/validations/profitability";
import type { ActionResult } from "@/lib/actions/clients";

export async function saveProjectSettings(projectId: string, input: ProjectSettingsInput): Promise<ActionResult> {
  const parsed = projectSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const v = parsed.data;
  const row = {
    overhead_pct: v.overheadPct / 100,
    supervisor_monthly_cost: v.supervisorMonthlyCost,
    project_duration_months: v.projectDurationMonths,
    target_margin_pct: v.targetMarginPct / 100,
    other_head_material_cost: v.otherHeadMaterialCost,
    other_head_labour_cost: v.otherHeadLabourCost,
  };

  const { data: existing } = await supabase
    .from("project_settings")
    .select("project_id")
    .eq("project_id", projectId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("project_settings").update(row).eq("project_id", projectId)
    : await supabase.from("project_settings").insert({ organization_id: ctx.organizationId, project_id: projectId, ...row });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}
