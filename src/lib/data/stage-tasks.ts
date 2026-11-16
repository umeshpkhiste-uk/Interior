import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type StageTaskRow = Database["public"]["Tables"]["stage_tasks"]["Row"];

export type StageTaskListItem = StageTaskRow & {
  projectCode: string;
  projectName: string;
  daysLate: number;
  statusLabel: string;
};

export async function listStageTasks(organizationId: string): Promise<StageTaskListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stage_tasks")
    .select("*, projects(project_code, name)")
    .eq("organization_id", organizationId)
    .order("planned_date", { ascending: true });
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
      ...statusFor(rest, today),
    };
  });
}

export type ProjectTaskSummary = { tasks: number; done: number; progress: number | null; currentStage: string | null };

/** Per-project tasks/done/progress and the stage of its earliest not-done task, for the Projects-adjacent KPIs. */
export async function getProjectTaskSummaries(organizationId: string): Promise<Map<string, ProjectTaskSummary>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stage_tasks")
    .select("project_id, stage, planned_date, done_on")
    .eq("organization_id", organizationId)
    .order("planned_date", { ascending: true });
  if (error) throw error;

  const byProject = new Map<string, { tasks: number; done: number; firstOpenStage: string | null; lastStage: string | null }>();
  for (const row of data ?? []) {
    const entry = byProject.get(row.project_id) ?? { tasks: 0, done: 0, firstOpenStage: null, lastStage: null };
    entry.tasks += 1;
    entry.lastStage = row.stage;
    if (row.done_on) {
      entry.done += 1;
    } else if (entry.firstOpenStage === null) {
      entry.firstOpenStage = row.stage;
    }
    byProject.set(row.project_id, entry);
  }

  const summaries = new Map<string, ProjectTaskSummary>();
  for (const [projectId, entry] of byProject) {
    summaries.set(projectId, {
      tasks: entry.tasks,
      done: entry.done,
      progress: entry.tasks > 0 ? entry.done / entry.tasks : null,
      currentStage: entry.firstOpenStage ?? entry.lastStage,
    });
  }
  return summaries;
}

function statusFor(task: StageTaskRow, today: Date): { daysLate: number; statusLabel: string } {
  if (task.done_on) return { daysLate: 0, statusLabel: "Done" };
  if (!task.planned_date) return { daysLate: 0, statusLabel: "Not scheduled" };

  const diff = daysBetween(today, task.planned_date);
  if (diff < 0) return { daysLate: -diff, statusLabel: `Overdue by ${-diff} day${diff === -1 ? "" : "s"}` };
  if (diff === 0) return { daysLate: 0, statusLabel: "Due today" };
  return { daysLate: 0, statusLabel: `Due in ${diff} days` };
}

function daysBetween(today: Date, dateStr: string): number {
  const date = new Date(`${dateStr}T00:00:00`);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((date.getTime() - todayMidnight.getTime()) / 86_400_000);
}
