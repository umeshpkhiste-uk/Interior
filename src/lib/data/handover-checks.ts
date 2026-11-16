import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type HandoverCheckRow = Database["public"]["Tables"]["handover_checks"]["Row"];

export type HandoverCheckListItem = HandoverCheckRow & {
  projectCode: string;
  projectName: string;
  statusLabel: "Done" | "Needs work" | "Not checked";
};

export async function listHandoverChecks(organizationId: string): Promise<HandoverCheckListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("handover_checks")
    .select("*, projects(project_code, name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const { projects, ...rest } = row as typeof row & {
      projects: { project_code: string; name: string } | null;
    };
    return {
      ...rest,
      projectCode: projects?.project_code ?? "—",
      projectName: projects?.name ?? "—",
      statusLabel: rest.result === "ok" ? "Done" : rest.result === "needs_work" ? "Needs work" : "Not checked",
    };
  });
}
