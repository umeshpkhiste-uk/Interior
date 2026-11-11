import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type PaintEstimationRow = Database["public"]["Tables"]["paint_estimations"]["Row"];

export async function listPaintEstimations(organizationId: string, projectId: string): Promise<PaintEstimationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("paint_estimations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
