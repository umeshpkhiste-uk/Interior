import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type LabourWeeklyPaymentRow = Database["public"]["Tables"]["labour_weekly_payments"]["Row"];

export type LabourWeeklyPaymentListItem = LabourWeeklyPaymentRow & {
  workerCode: string;
  workerName: string;
  earned: number;
  balance: number;
  statusLabel: "Paid" | "Due";
};

export async function listLabourWeeklyPayments(organizationId: string): Promise<LabourWeeklyPaymentListItem[]> {
  const supabase = await createClient();
  const [paymentsRes, attendanceRes] = await Promise.all([
    supabase
      .from("labour_weekly_payments")
      .select("*, workers(worker_code, name)")
      .eq("organization_id", organizationId)
      .order("week_starting", { ascending: false }),
    supabase.from("labour_attendance").select("worker_id, attendance_date, total_pay").eq("organization_id", organizationId),
  ]);
  if (paymentsRes.error) throw paymentsRes.error;
  if (attendanceRes.error) throw attendanceRes.error;

  const attendance = attendanceRes.data ?? [];
  const rows = paymentsRes.data as (LabourWeeklyPaymentRow & { workers: { worker_code: string; name: string } | null })[];

  return rows.map((row) => {
    const { workers, ...rest } = row;
    const weekEnd = new Date(`${rest.week_starting}T00:00:00`);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndKey = weekEnd.toISOString().slice(0, 10);
    const earned = attendance
      .filter((a) => a.worker_id === rest.worker_id && a.attendance_date >= rest.week_starting && a.attendance_date <= weekEndKey)
      .reduce((acc, a) => acc + a.total_pay, 0);
    const balance = earned - rest.advance_recovered - rest.paid;
    return {
      ...rest,
      workerCode: workers?.worker_code ?? "—",
      workerName: workers?.name ?? "—",
      earned,
      balance,
      statusLabel: balance > 0 ? "Due" : "Paid",
    };
  });
}
