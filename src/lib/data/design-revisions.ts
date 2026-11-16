import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type DesignRevisionRow = Database["public"]["Tables"]["design_revisions"]["Row"];

const CHASE_AFTER_DAYS = 5;

export type DesignRevisionListItem = DesignRevisionRow & {
  projectCode: string;
  projectName: string;
  isLatestVersion: boolean;
  days: number;
  statusLabel: string;
};

export async function listDesignRevisions(organizationId: string): Promise<DesignRevisionListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("design_revisions")
    .select("*, projects(project_code, name)")
    .eq("organization_id", organizationId)
    .order("sent_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;

  const today = new Date();
  const seenKey = new Set<string>();

  return (data ?? []).map((row) => {
    const { projects, ...rest } = row as typeof row & {
      projects: { project_code: string; name: string } | null;
    };
    const key = `${rest.project_id}|${rest.room_area ?? ""}|${rest.drawing}`;
    const isLatestVersion = !seenKey.has(key);
    seenKey.add(key);

    const days = rest.reply_on
      ? daysBetween(rest.sent_on, new Date(`${rest.reply_on}T00:00:00`))
      : daysBetween(rest.sent_on, today);

    let statusLabel: string;
    if (!isLatestVersion) statusLabel = "Newer version sent";
    else if (rest.reply_status === "approved") statusLabel = "Approved";
    else if (rest.reply_status === "changes_requested") statusLabel = "Changes requested";
    else statusLabel = days > CHASE_AFTER_DAYS ? "To chase" : "Waiting";

    return {
      ...rest,
      projectCode: projects?.project_code ?? "—",
      projectName: projects?.name ?? "—",
      isLatestVersion,
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
