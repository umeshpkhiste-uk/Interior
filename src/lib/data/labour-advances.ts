import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type LabourAdvanceRow = Database["public"]["Tables"]["labour_advances"]["Row"];

export type LabourAdvanceListItem = LabourAdvanceRow & {
  workerCode: string;
  workerName: string;
  stillDue: number;
};

export async function listLabourAdvances(organizationId: string): Promise<LabourAdvanceListItem[]> {
  const supabase = await createClient();
  const [advancesRes, paymentsRes] = await Promise.all([
    supabase
      .from("labour_advances")
      .select("*, workers(worker_code, name)")
      .eq("organization_id", organizationId)
      .order("advance_date", { ascending: false }),
    supabase.from("labour_weekly_payments").select("worker_id, advance_recovered").eq("organization_id", organizationId),
  ]);
  if (advancesRes.error) throw advancesRes.error;
  if (paymentsRes.error) throw paymentsRes.error;

  const recoveredByWorker = new Map<string, number>();
  for (const row of paymentsRes.data ?? []) {
    recoveredByWorker.set(row.worker_id, (recoveredByWorker.get(row.worker_id) ?? 0) + row.advance_recovered);
  }
  const givenByWorker = new Map<string, number>();
  const rows = advancesRes.data as (LabourAdvanceRow & { workers: { worker_code: string; name: string } | null })[];
  for (const row of rows) {
    givenByWorker.set(row.worker_id, (givenByWorker.get(row.worker_id) ?? 0) + row.amount);
  }

  return rows.map((row) => {
    const { workers, ...rest } = row;
    const stillDue = (givenByWorker.get(rest.worker_id) ?? 0) - (recoveredByWorker.get(rest.worker_id) ?? 0);
    return {
      ...rest,
      workerCode: workers?.worker_code ?? "—",
      workerName: workers?.name ?? "—",
      stillDue,
    };
  });
}
