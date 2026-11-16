import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type ClientApprovalRow = Database["public"]["Tables"]["client_approvals"]["Row"];

const CHASE_AFTER_DAYS = 7;

export type ClientApprovalListItem = ClientApprovalRow & {
  projectCode: string;
  projectName: string;
  days: number;
  statusLabel: string;
};

export async function listClientApprovals(organizationId: string): Promise<ClientApprovalListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_approvals")
    .select("*, projects(project_code, name)")
    .eq("organization_id", organizationId)
    .order("sent_on", { ascending: false });
  if (error) throw error;

  const today = new Date();

  return (data ?? []).map((row) => {
    const { projects, ...rest } = row as typeof row & {
      projects: { project_code: string; name: string } | null;
    };
    const days = rest.approved_on
      ? daysBetween(rest.sent_on, new Date(`${rest.approved_on}T00:00:00`))
      : daysBetween(rest.sent_on, today);

    const statusLabel = rest.approved_on
      ? "Approved"
      : days > CHASE_AFTER_DAYS
        ? "To chase"
        : "Waiting";

    return {
      ...rest,
      projectCode: projects?.project_code ?? "—",
      projectName: projects?.name ?? "—",
      days,
      statusLabel,
    };
  });
}

function daysBetween(dateStr: string, reference: Date): number {
  const date = new Date(`${dateStr}T00:00:00`);
  const refMidnight = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  return Math.round((refMidnight.getTime() - date.getTime()) / 86_400_000);
}
