import { createClient } from "@/lib/supabase/server";
import { LABOUR_TRADE_LABELS } from "@/lib/validations/worker";

export type LabourPaymentKpis = {
  workers: number;
  onSiteToday: number;
  thisWeekEarned: number;
  lastWeekEarned: number;
  advanceDue: number;
  paid: number;
};

export async function getLabourPaymentKpis(organizationId: string): Promise<LabourPaymentKpis> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mondayOffset = (today.getDay() + 6) % 7;
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - mondayOffset);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const thisWeekStartKey = thisWeekStart.toISOString().slice(0, 10);
  const lastWeekStartKey = lastWeekStart.toISOString().slice(0, 10);
  const todayKey = today.toISOString().slice(0, 10);

  const [workersRes, attendanceRes, advancesRes, paymentsRes] = await Promise.all([
    supabase.from("workers").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase
      .from("labour_attendance")
      .select("worker_id, attendance_date, status, total_pay")
      .eq("organization_id", organizationId)
      .gte("attendance_date", lastWeekStartKey),
    supabase.from("labour_advances").select("amount").eq("organization_id", organizationId),
    supabase.from("labour_weekly_payments").select("advance_recovered, paid").eq("organization_id", organizationId),
  ]);
  if (attendanceRes.error) throw attendanceRes.error;
  if (advancesRes.error) throw advancesRes.error;
  if (paymentsRes.error) throw paymentsRes.error;

  const attendance = attendanceRes.data ?? [];
  const thisWeekEarned = attendance.filter((a) => a.attendance_date >= thisWeekStartKey).reduce((acc, a) => acc + a.total_pay, 0);
  const lastWeekEarned = attendance
    .filter((a) => a.attendance_date >= lastWeekStartKey && a.attendance_date < thisWeekStartKey)
    .reduce((acc, a) => acc + a.total_pay, 0);
  const onSiteToday = new Set(attendance.filter((a) => a.attendance_date === todayKey && a.status !== "absent").map((a) => a.worker_id)).size;

  const advancesGiven = (advancesRes.data ?? []).reduce((acc, a) => acc + a.amount, 0);
  const advancesRecovered = (paymentsRes.data ?? []).reduce((acc, p) => acc + p.advance_recovered, 0);
  const paid = (paymentsRes.data ?? []).reduce((acc, p) => acc + p.paid, 0);

  return {
    workers: workersRes.count ?? 0,
    onSiteToday,
    thisWeekEarned,
    lastWeekEarned,
    advanceDue: advancesGiven - advancesRecovered,
    paid,
  };
}

export type LabourPaymentDashboard = {
  earnedByWeek: { label: string; earned: number; paid: number }[];
  byProject: { label: string; allTime: number; lastWeek: number }[];
  byTrade: { trade: string; workers: number; thisWeek: number; lastWeek: number }[];
  attendanceCalendar: { worker: string; days: { date: string; value: number | "P" }[]; total: number }[];
  insights: string[];
};

const TOP_PROJECTS = 6;
const CALENDAR_DAYS = 14;

export async function getLabourPaymentDashboard(organizationId: string): Promise<LabourPaymentDashboard> {
  const supabase = await createClient();
  const [workersRes, attendanceRes, paymentsRes] = await Promise.all([
    supabase.from("workers").select("id, name, trade, worker_code").eq("organization_id", organizationId),
    supabase
      .from("labour_attendance")
      .select("worker_id, attendance_date, status, total_pay, projects(project_code)")
      .eq("organization_id", organizationId),
    supabase.from("labour_weekly_payments").select("week_starting, paid").eq("organization_id", organizationId),
  ]);
  if (workersRes.error) throw workersRes.error;
  if (attendanceRes.error) throw attendanceRes.error;
  if (paymentsRes.error) throw paymentsRes.error;

  const workers = workersRes.data ?? [];
  const attendance = (attendanceRes.data ?? []) as {
    worker_id: string;
    attendance_date: string;
    status: string;
    total_pay: number;
    projects: { project_code: string } | null;
  }[];
  const payments = paymentsRes.data ?? [];

  const weeks = lastNWeeks(6);
  const earnedByWeek = new Map(weeks.map((w) => [w.key, 0]));
  const paidByWeek = new Map(weeks.map((w) => [w.key, 0]));
  for (const row of attendance) {
    const key = weekKeyFor(row.attendance_date, weeks);
    if (key && earnedByWeek.has(key)) earnedByWeek.set(key, (earnedByWeek.get(key) ?? 0) + row.total_pay);
  }
  for (const payment of payments) {
    const key = weekKeyFor(payment.week_starting, weeks);
    if (key && paidByWeek.has(key)) paidByWeek.set(key, (paidByWeek.get(key) ?? 0) + payment.paid);
  }
  const lastWeekKey = weeks[weeks.length - 1]?.key;

  const allTimeByProject = new Map<string, number>();
  const lastWeekByProject = new Map<string, number>();
  for (const row of attendance) {
    const projectCode = row.projects?.project_code ?? "Unassigned";
    allTimeByProject.set(projectCode, (allTimeByProject.get(projectCode) ?? 0) + row.total_pay);
    const key = weekKeyFor(row.attendance_date, weeks);
    if (key === lastWeekKey) {
      lastWeekByProject.set(projectCode, (lastWeekByProject.get(projectCode) ?? 0) + row.total_pay);
    }
  }
  const topProjects = [...allTimeByProject.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_PROJECTS).map(([code]) => code);
  const byProject = topProjects.map((code) => ({
    label: code,
    allTime: allTimeByProject.get(code) ?? 0,
    lastWeek: lastWeekByProject.get(code) ?? 0,
  }));

  const thisWeekKey = weeks[weeks.length - 1]?.key;
  const thisWeekEarnedByWorker = new Map<string, number>();
  const lastWeekEarnedByWorker = new Map<string, number>();
  for (const row of attendance) {
    const key = weekKeyFor(row.attendance_date, weeks);
    if (key === thisWeekKey) thisWeekEarnedByWorker.set(row.worker_id, (thisWeekEarnedByWorker.get(row.worker_id) ?? 0) + row.total_pay);
    if (key === lastWeekKey) lastWeekEarnedByWorker.set(row.worker_id, (lastWeekEarnedByWorker.get(row.worker_id) ?? 0) + row.total_pay);
  }
  const tradeStats = new Map<string, { workers: number; thisWeek: number; lastWeek: number }>();
  for (const worker of workers) {
    const entry = tradeStats.get(worker.trade) ?? { workers: 0, thisWeek: 0, lastWeek: 0 };
    entry.workers += 1;
    entry.thisWeek += thisWeekEarnedByWorker.get(worker.id) ?? 0;
    entry.lastWeek += lastWeekEarnedByWorker.get(worker.id) ?? 0;
    tradeStats.set(worker.trade, entry);
  }
  const byTrade = [...tradeStats.entries()].map(([trade, v]) => ({
    trade: LABOUR_TRADE_LABELS[trade as keyof typeof LABOUR_TRADE_LABELS] ?? trade,
    ...v,
  }));

  const attendanceCalendar = buildAttendanceCalendar(workers, attendance);

  const totalEarned = attendance.reduce((acc, a) => acc + a.total_pay, 0);
  const totalPaid = payments.reduce((acc, p) => acc + p.paid, 0);
  const biggestTrade = [...tradeStats.entries()].sort((a, b) => b[1].lastWeek - a[1].lastWeek)[0];
  const biggestProject = [...allTimeByProject.entries()].sort((a, b) => b[1] - a[1])[0];

  const insights: string[] = [
    `${workers.length} workers; ${formatPlainINR(totalEarned)} earned all time, ${formatPlainINR(totalPaid)} paid.`,
    biggestTrade ? `Biggest trade cost last week: ${LABOUR_TRADE_LABELS[biggestTrade[0] as keyof typeof LABOUR_TRADE_LABELS] ?? biggestTrade[0]} (${formatPlainINR(biggestTrade[1].lastWeek)}).` : "No attendance marked yet.",
    biggestProject ? `Most labour went to ${biggestProject[0]} (${formatPlainINR(biggestProject[1])}).` : "No projects logged yet.",
  ];

  return { earnedByWeek: weeks.map((w) => ({ label: w.label, earned: earnedByWeek.get(w.key) ?? 0, paid: paidByWeek.get(w.key) ?? 0 })), byProject, byTrade, attendanceCalendar, insights };
}

function buildAttendanceCalendar(
  workers: { id: string; name: string }[],
  attendance: { worker_id: string; attendance_date: string; status: string }[]
): LabourPaymentDashboard["attendanceCalendar"] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: string[] = [];
  for (let i = CALENDAR_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const byWorkerDate = new Map<string, string>();
  for (const row of attendance) {
    byWorkerDate.set(`${row.worker_id}|${row.attendance_date}`, row.status);
  }

  return workers.map((worker) => {
    let total = 0;
    const cells = days.map((date) => {
      const status = byWorkerDate.get(`${worker.id}|${date}`);
      const value: number | "P" = status === "full_day" ? 1 : status === "half_day" ? 0.5 : status === "piece_work_only" ? "P" : 0;
      if (typeof value === "number") total += value;
      return { date, value };
    });
    return { worker: worker.name, days: cells, total };
  });
}

function formatPlainINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function lastNWeeks(n: number): { key: string; label: string; start: Date; end: Date }[] {
  const weeks: { key: string; label: string; start: Date; end: Date }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mondayOffset = (today.getDay() + 6) % 7;
  const thisMonday = new Date(today);
  thisMonday.setDate(thisMonday.getDate() - mondayOffset);
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(thisMonday);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
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
