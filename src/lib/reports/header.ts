import { createClient } from "@/lib/supabase/server";
import type { ReportHeader } from "./types";

export async function getReportHeader(organizationId: string, projectId?: string): Promise<ReportHeader> {
  const supabase = await createClient();

  const [{ data: org }, projectRes] = await Promise.all([
    supabase.from("organizations").select("name, address, gstin").eq("id", organizationId).single(),
    projectId
      ? supabase.from("projects").select("name, clients(name)").eq("organization_id", organizationId).eq("id", projectId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const project = projectRes.data as { name: string; clients: { name: string } | null } | null;

  return {
    organizationName: org?.name ?? "Studio",
    organizationAddress: org?.address ?? null,
    organizationGstin: org?.gstin ?? null,
    projectName: project?.name ?? null,
    clientName: project?.clients?.name ?? null,
    generatedAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
  };
}
