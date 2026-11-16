import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type LabourAttendanceRow = Database["public"]["Tables"]["labour_attendance"]["Row"];

export type LabourAttendanceListItem = LabourAttendanceRow & {
  workerCode: string;
  workerName: string;
  projectCode: string | null;
};

export async function listLabourAttendance(organizationId: string): Promise<LabourAttendanceListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("labour_attendance")
    .select("*, workers(worker_code, name), projects(project_code)")
    .eq("organization_id", organizationId)
    .order("attendance_date", { ascending: false });
  if (error) throw error;

  return (
    data as (LabourAttendanceRow & {
      workers: { worker_code: string; name: string } | null;
      projects: { project_code: string } | null;
    })[]
  ).map((row) => {
    const { workers, projects, ...rest } = row;
    return {
      ...rest,
      workerCode: workers?.worker_code ?? "—",
      workerName: workers?.name ?? "—",
      projectCode: projects?.project_code ?? null,
    };
  });
}
