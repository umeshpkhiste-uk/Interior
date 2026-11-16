import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type ProjectCostRow = Database["public"]["Tables"]["project_expenses"]["Row"];

export type ProjectCostListItem = ProjectCostRow & { projectCode: string };

/** project_expenses across all projects, for the kit's cross-project Project Costs tab. */
export async function listAllProjectCosts(organizationId: string): Promise<ProjectCostListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_expenses")
    .select("*, projects(project_code)")
    .eq("organization_id", organizationId)
    .order("expense_date", { ascending: false });
  if (error) throw error;

  const rows = data as (ProjectCostRow & { projects: { project_code: string } | null })[];
  return rows.map((row) => {
    const { projects, ...rest } = row;
    return { ...rest, projectCode: projects?.project_code ?? "—" };
  });
}
