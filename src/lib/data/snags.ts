import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type SnagRow = Database["public"]["Tables"]["snags"]["Row"];

const DUE_SOON_DAYS = 3;

export type SnagListItem = SnagRow & {
  projectCode: string;
  projectName: string;
  daysToFix: number | null;
  statusLabel: "Fixed" | "Overdue" | "Due soon" | "Open";
};

export async function listSnags(organizationId: string): Promise<SnagListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("snags")
    .select("*, projects(project_code, name)")
    .eq("organization_id", organizationId)
    .order("found_on", { ascending: false });
  if (error) throw error;

  const today = new Date();

  return (data ?? []).map((row) => {
    const { projects, ...rest } = row as typeof row & {
      projects: { project_code: string; name: string } | null;
    };

    return {
      ...rest,
      projectCode: projects?.project_code ?? "—",
      projectName: projects?.name ?? "—",
      daysToFix: rest.fixed_on ? daysBetween(rest.found_on, new Date(`${rest.fixed_on}T00:00:00`)) : null,
      statusLabel: statusFor(rest, today),
    };
  });
}

function statusFor(
  snag: SnagRow,
  today: Date
): "Fixed" | "Overdue" | "Due soon" | "Open" {
  if (snag.fixed_on) return "Fixed";
  if (!snag.fix_by) return "Open";
  const daysToDue = daysBetween(todayIso(today), new Date(`${snag.fix_by}T00:00:00`));
  if (daysToDue < 0) return "Overdue";
  if (daysToDue <= DUE_SOON_DAYS) return "Due soon";
  return "Open";
}

function todayIso(today: Date): string {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function daysBetween(fromStr: string, to: Date): number {
  const from = new Date(`${fromStr}T00:00:00`);
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toMidnight.getTime() - from.getTime()) / 86_400_000);
}
