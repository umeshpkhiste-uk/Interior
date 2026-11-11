"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { projectSchema, type ProjectInput } from "@/lib/validations/project";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: ProjectInput) {
  return {
    client_id: input.clientId,
    name: input.name,
    property_address: input.propertyAddress || null,
    property_type: input.propertyType || null,
    bedrooms: input.bedrooms ?? null,
    bathrooms: input.bathrooms ?? null,
    carpet_area: input.carpetArea ?? null,
    built_up_area: input.builtUpArea ?? null,
    start_date: input.startDate || null,
    expected_completion_date: input.expectedCompletionDate || null,
    status: input.status,
    description: input.description || null,
    assigned_designer_id: input.assignedDesignerId || null,
  };
}

export async function createProject(input: ProjectInput): Promise<ActionResult<{ id: string }>> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  const { data: projectCode, error: codeError } = await supabase.rpc("allocate_project_code", {
    p_org_id: ctx.organizationId,
  });
  if (codeError) return { error: codeError.message };

  const { data, error } = await supabase
    .from("projects")
    .insert({ organization_id: ctx.organizationId, project_code: projectCode, ...toRow(parsed.data) })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { error: null, data: { id: data.id } };
}

export async function updateProject(projectId: string, input: ProjectInput): Promise<ActionResult> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update(toRow(parsed.data))
    .eq("id", projectId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function setProjectArchived(projectId: string, archived: boolean): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", projectId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function duplicateProject(projectId: string): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  const { data: original, error: fetchError } = await supabase
    .from("projects")
    .select(
      "client_id, name, property_address, property_type, bedrooms, bathrooms, carpet_area, built_up_area, description, assigned_designer_id"
    )
    .eq("id", projectId)
    .eq("organization_id", ctx.organizationId)
    .single();
  if (fetchError) return { error: fetchError.message };

  const { data: projectCode, error: codeError } = await supabase.rpc("allocate_project_code", {
    p_org_id: ctx.organizationId,
  });
  if (codeError) return { error: codeError.message };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      organization_id: ctx.organizationId,
      project_code: projectCode,
      ...original,
      name: `${original.name} (Copy)`,
      status: "enquiry",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { error: null, data: { id: data.id } };
}
