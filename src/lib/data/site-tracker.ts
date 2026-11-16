import { createClient } from "@/lib/supabase/server";
import { listProjects, type ProjectListItem } from "@/lib/data/projects";
import { getProjectTaskSummaries } from "@/lib/data/stage-tasks";
import { PROJECT_STATUS_LABELS, PROJECT_STATUSES } from "@/lib/validations/project";

const HANDOVER_SOON_DAYS = 30;
const SITE_VISITS_WINDOW_DAYS = 42; // 6 weeks, matches the source sheet's "last 6 weeks" cards

function isActive(project: ProjectListItem): boolean {
  return project.status !== "completed" && project.status !== "cancelled";
}

export type SiteTrackerKpis = {
  activeProjects: number;
  workInHand: number;
  handoverSoon: number;
  avgProgress: number | null;
  tasksDone: number;
  siteVisits: number;
};

export async function getSiteTrackerKpis(organizationId: string): Promise<SiteTrackerKpis> {
  const supabase = await createClient();
  const projects = await listProjects(organizationId);
  const activeProjects = projects.filter(isActive);
  const activeIds = activeProjects.map((p) => p.id);

  const since = new Date();
  since.setDate(since.getDate() - SITE_VISITS_WINDOW_DAYS);
  const sinceIso = since.toISOString().slice(0, 10);

  const [boqRes, tasksDoneRes, siteVisitsRes, taskSummaries] = await Promise.all([
    activeIds.length > 0
      ? supabase.from("boq_items").select("amount").eq("organization_id", organizationId).in("project_id", activeIds)
      : Promise.resolve({ data: [] as { amount: number }[] }),
    supabase
      .from("stage_tasks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .not("done_on", "is", null),
    supabase
      .from("site_visits")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("visit_date", sinceIso),
    getProjectTaskSummaries(organizationId),
  ]);

  const workInHand = (boqRes.data ?? []).reduce((acc, row) => acc + row.amount, 0);

  const today = new Date();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + HANDOVER_SOON_DAYS);
  const handoverSoon = activeProjects.filter((p) => {
    if (!p.expected_completion_date) return false;
    const date = new Date(`${p.expected_completion_date}T00:00:00`);
    return date >= today && date <= horizon;
  }).length;

  const progressValues = activeIds
    .map((id) => taskSummaries.get(id)?.progress)
    .filter((p): p is number => p != null);
  const avgProgress =
    progressValues.length > 0 ? progressValues.reduce((a, b) => a + b, 0) / progressValues.length : null;

  return {
    activeProjects: activeProjects.length,
    workInHand,
    handoverSoon,
    avgProgress,
    tasksDone: tasksDoneRes.count ?? 0,
    siteVisits: siteVisitsRes.count ?? 0,
  };
}

export type SiteTrackerDashboard = {
  projectsByStage: { label: string; count: number }[];
  workInHandByProject: { label: string; value: number }[];
  siteVisitsByWeek: { label: string; visits: number }[];
  nextHandovers: {
    id: string;
    projectCode: string;
    name: string;
    clientName: string;
    expectedCompletionDate: string;
    daysLeft: number;
  }[];
  insights: string[];
};

export async function getSiteTrackerDashboard(organizationId: string): Promise<SiteTrackerDashboard> {
  const supabase = await createClient();
  const projects = await listProjects(organizationId);
  const activeProjects = projects.filter(isActive);
  const activeIds = activeProjects.map((p) => p.id);

  const [boqRes, visitsRes] = await Promise.all([
    activeIds.length > 0
      ? supabase.from("boq_items").select("project_id, amount").eq("organization_id", organizationId).in("project_id", activeIds)
      : Promise.resolve({ data: [] as { project_id: string; amount: number }[] }),
    supabase.from("site_visits").select("visit_date").eq("organization_id", organizationId),
  ]);

  const byStage = new Map<string, number>();
  for (const p of activeProjects) {
    byStage.set(p.status, (byStage.get(p.status) ?? 0) + 1);
  }

  const valueByProject = new Map<string, number>();
  for (const row of boqRes.data ?? []) {
    valueByProject.set(row.project_id, (valueByProject.get(row.project_id) ?? 0) + row.amount);
  }
  const projectById = new Map(activeProjects.map((p) => [p.id, p]));
  const workInHandByProject = [...valueByProject.entries()]
    .map(([projectId, value]) => ({ label: projectById.get(projectId)?.project_code ?? "—", value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const weeks = lastNWeeks(6);
  const visitsByWeek = new Map(weeks.map((w) => [w.key, 0]));
  for (const visit of visitsRes.data ?? []) {
    const key = weekKeyFor(visit.visit_date, weeks);
    if (key && visitsByWeek.has(key)) visitsByWeek.set(key, (visitsByWeek.get(key) ?? 0) + 1);
  }

  const today = new Date();
  const nextHandovers = activeProjects
    .filter((p) => p.expected_completion_date != null)
    .map((p) => ({
      id: p.id,
      projectCode: p.project_code,
      name: p.name,
      clientName: p.clientName,
      expectedCompletionDate: p.expected_completion_date as string,
      daysLeft: daysBetween(today, p.expected_completion_date as string),
    }))
    .sort((a, b) => a.expectedCompletionDate.localeCompare(b.expectedCompletionDate))
    .slice(0, 6);

  const totalActive = activeProjects.length;
  const totalWorkInHand = [...valueByProject.values()].reduce((a, b) => a + b, 0);
  const mostCommonStage = [...byStage.entries()].sort((a, b) => b[1] - a[1])[0];
  const totalVisitsRecent = [...visitsByWeek.values()].reduce((a, b) => a + b, 0);
  const nextHandover = nextHandovers[0];

  const insights: string[] = [
    `${totalActive} active project${totalActive === 1 ? "" : "s"}, ${formatPlainINR(totalWorkInHand)} of work in hand.`,
    mostCommonStage
      ? `Most projects are at: ${PROJECT_STATUS_LABELS[mostCommonStage[0] as (typeof PROJECT_STATUSES)[number]] ?? mostCommonStage[0]} (${mostCommonStage[1]}).`
      : "No active projects yet.",
    `${totalVisitsRecent} site visits logged in the last 6 weeks.`,
    nextHandover
      ? `Next handover: ${nextHandover.projectCode} (${nextHandover.clientName}) in ${nextHandover.daysLeft} day${nextHandover.daysLeft === 1 ? "" : "s"}.`
      : "No handover dates set yet.",
  ];

  return {
    projectsByStage: PROJECT_STATUSES.filter((s) => byStage.has(s)).map((status) => ({
      label: PROJECT_STATUS_LABELS[status],
      count: byStage.get(status) ?? 0,
    })),
    workInHandByProject,
    siteVisitsByWeek: weeks.map((w) => ({ label: w.label, visits: visitsByWeek.get(w.key) ?? 0 })),
    nextHandovers,
    insights,
  };
}

export type ProjectProgressItem = {
  id: string;
  projectCode: string;
  name: string;
  clientName: string;
  propertyAddress: string | null;
  status: ProjectListItem["status"];
  workInHand: number;
  startDate: string | null;
  expectedCompletionDate: string | null;
  daysLeft: number | null;
  tasks: number;
  done: number;
  progress: number | null;
  currentStage: string | null;
  visits: number;
};

/** A read-only rollup standing in for the source sheet's own "Projects" list — this app's real Projects
 * registry (client, status, dates, BOQ) is the source of truth, so this just joins task/visit progress onto it
 * rather than re-collecting project, client and value fields that already live there. */
export async function getProjectProgressOverview(organizationId: string): Promise<ProjectProgressItem[]> {
  const supabase = await createClient();
  const projects = await listProjects(organizationId);
  const projectIds = projects.map((p) => p.id);

  const [boqRes, visitsRes, taskSummaries] = await Promise.all([
    projectIds.length > 0
      ? supabase.from("boq_items").select("project_id, amount").eq("organization_id", organizationId).in("project_id", projectIds)
      : Promise.resolve({ data: [] as { project_id: string; amount: number }[] }),
    projectIds.length > 0
      ? supabase.from("site_visits").select("project_id").eq("organization_id", organizationId).in("project_id", projectIds)
      : Promise.resolve({ data: [] as { project_id: string }[] }),
    getProjectTaskSummaries(organizationId),
  ]);

  const valueByProject = new Map<string, number>();
  for (const row of boqRes.data ?? []) {
    valueByProject.set(row.project_id, (valueByProject.get(row.project_id) ?? 0) + row.amount);
  }
  const visitsByProject = new Map<string, number>();
  for (const row of visitsRes.data ?? []) {
    visitsByProject.set(row.project_id, (visitsByProject.get(row.project_id) ?? 0) + 1);
  }

  const today = new Date();
  return projects.map((p) => ({
    id: p.id,
    projectCode: p.project_code,
    name: p.name,
    clientName: p.clientName,
    propertyAddress: p.property_address,
    status: p.status,
    workInHand: valueByProject.get(p.id) ?? 0,
    startDate: p.start_date,
    expectedCompletionDate: p.expected_completion_date,
    daysLeft: p.expected_completion_date ? daysBetween(today, p.expected_completion_date) : null,
    tasks: taskSummaries.get(p.id)?.tasks ?? 0,
    done: taskSummaries.get(p.id)?.done ?? 0,
    progress: taskSummaries.get(p.id)?.progress ?? null,
    currentStage: taskSummaries.get(p.id)?.currentStage ?? null,
    visits: visitsByProject.get(p.id) ?? 0,
  }));
}

function formatPlainINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function daysBetween(today: Date, dateStr: string): number {
  const date = new Date(`${dateStr}T00:00:00`);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((date.getTime() - todayMidnight.getTime()) / 86_400_000);
}

function lastNWeeks(n: number): { key: string; label: string; start: Date; end: Date }[] {
  const weeks: { key: string; label: string; start: Date; end: Date }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const end = new Date(today);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const key = start.toISOString().slice(0, 10);
    const label = `${start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
    weeks.push({ key, label, start, end });
  }
  return weeks;
}

function weekKeyFor(dateStr: string, weeks: { key: string; start: Date; end: Date }[]): string | null {
  const date = new Date(`${dateStr}T00:00:00`);
  for (const week of weeks) {
    if (date >= week.start && date <= week.end) return week.key;
  }
  return null;
}
