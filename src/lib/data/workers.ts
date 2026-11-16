import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type WorkerRow = Database["public"]["Tables"]["workers"]["Row"];

export type WorkerOption = { id: string; workerCode: string; name: string; trade: WorkerRow["trade"]; dailyWage: number };

export async function listWorkerOptions(organizationId: string): Promise<WorkerOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workers")
    .select("id, worker_code, name, trade, daily_wage")
    .eq("organization_id", organizationId)
    .order("worker_code");
  if (error) throw error;
  return (data ?? []).map((w) => ({ id: w.id, workerCode: w.worker_code, name: w.name, trade: w.trade, dailyWage: w.daily_wage }));
}

export type WorkerListItem = WorkerRow & {
  daysThisWeek: number;
  earnedThisWeek: number;
  earnedLastWeek: number;
  advanceDue: number;
  paidSoFar: number;
  today: string;
};

export async function listWorkersWithTotals(organizationId: string): Promise<WorkerListItem[]> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mondayOffset = (today.getDay() + 6) % 7;
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - mondayOffset);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const todayKey = today.toISOString().slice(0, 10);

  const [workersRes, attendanceRes, advancesRes, paymentsRes] = await Promise.all([
    supabase.from("workers").select("*").eq("organization_id", organizationId).order("worker_code"),
    supabase
      .from("labour_attendance")
      .select("worker_id, attendance_date, status, total_pay")
      .eq("organization_id", organizationId)
      .gte("attendance_date", lastWeekStart.toISOString().slice(0, 10)),
    supabase.from("labour_advances").select("worker_id, amount").eq("organization_id", organizationId),
    supabase.from("labour_weekly_payments").select("worker_id, advance_recovered, paid").eq("organization_id", organizationId),
  ]);
  if (workersRes.error) throw workersRes.error;
  if (attendanceRes.error) throw attendanceRes.error;
  if (advancesRes.error) throw advancesRes.error;
  if (paymentsRes.error) throw paymentsRes.error;

  const thisWeekStartKey = thisWeekStart.toISOString().slice(0, 10);
  const earnedThisWeek = new Map<string, number>();
  const earnedLastWeek = new Map<string, number>();
  const daysThisWeek = new Map<string, number>();
  const todayStatus = new Map<string, string>();
  for (const row of attendanceRes.data ?? []) {
    if (row.attendance_date >= thisWeekStartKey) {
      earnedThisWeek.set(row.worker_id, (earnedThisWeek.get(row.worker_id) ?? 0) + row.total_pay);
      if (row.status !== "absent") {
        daysThisWeek.set(row.worker_id, (daysThisWeek.get(row.worker_id) ?? 0) + (row.status === "half_day" ? 0.5 : row.status === "piece_work_only" ? 0 : 1));
      }
    } else {
      earnedLastWeek.set(row.worker_id, (earnedLastWeek.get(row.worker_id) ?? 0) + row.total_pay);
    }
    if (row.attendance_date === todayKey) {
      todayStatus.set(row.worker_id, row.status);
    }
  }

  const advancesByWorker = new Map<string, number>();
  for (const row of advancesRes.data ?? []) {
    advancesByWorker.set(row.worker_id, (advancesByWorker.get(row.worker_id) ?? 0) + row.amount);
  }
  const recoveredByWorker = new Map<string, number>();
  const paidByWorker = new Map<string, number>();
  for (const row of paymentsRes.data ?? []) {
    recoveredByWorker.set(row.worker_id, (recoveredByWorker.get(row.worker_id) ?? 0) + row.advance_recovered);
    paidByWorker.set(row.worker_id, (paidByWorker.get(row.worker_id) ?? 0) + row.paid);
  }

  const statusLabel: Record<string, string> = { full_day: "Full day", half_day: "Half day", piece_work_only: "Piece work", absent: "Absent" };

  return (workersRes.data ?? []).map((worker) => ({
    ...worker,
    daysThisWeek: daysThisWeek.get(worker.id) ?? 0,
    earnedThisWeek: earnedThisWeek.get(worker.id) ?? 0,
    earnedLastWeek: earnedLastWeek.get(worker.id) ?? 0,
    advanceDue: (advancesByWorker.get(worker.id) ?? 0) - (recoveredByWorker.get(worker.id) ?? 0),
    paidSoFar: paidByWorker.get(worker.id) ?? 0,
    today: todayStatus.has(worker.id) ? statusLabel[todayStatus.get(worker.id)!] ?? "Not marked" : "Not marked",
  }));
}
