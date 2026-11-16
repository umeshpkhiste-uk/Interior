import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type SiteVisitRow = Database["public"]["Tables"]["site_visits"]["Row"];

export type SiteVisitListItem = SiteVisitRow & {
  projectCode: string;
  projectName: string;
  daysAgo: number;
  nextVisitDate: string | null;
  nextVisitOverdue: boolean;
};

export async function listSiteVisits(organizationId: string): Promise<SiteVisitListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_visits")
    .select("*, projects(project_code, name)")
    .eq("organization_id", organizationId)
    .order("visit_date", { ascending: false });
  if (error) throw error;

  const today = new Date();
  return (data ?? []).map((row) => {
    const { projects, ...rest } = row as typeof row & {
      projects: { project_code: string; name: string } | null;
    };
    const nextVisitDate = rest.next_visit_in_days != null ? addDays(rest.visit_date, rest.next_visit_in_days) : null;

    return {
      ...rest,
      projectCode: projects?.project_code ?? "—",
      projectName: projects?.name ?? "—",
      daysAgo: daysBetween(rest.visit_date, today),
      nextVisitDate,
      nextVisitOverdue: nextVisitDate != null && nextVisitDate < todayIso(today),
    };
  });
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayIso(today: Date): string {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function daysBetween(dateStr: string, today: Date): number {
  const date = new Date(`${dateStr}T00:00:00`);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((todayMidnight.getTime() - date.getTime()) / 86_400_000);
}
