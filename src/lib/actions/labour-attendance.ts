"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { labourAttendanceSchema, type LabourAttendanceInput } from "@/lib/validations/labour-attendance";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: LabourAttendanceInput, dayWage: number) {
  return {
    worker_id: input.workerId,
    project_id: input.projectId || null,
    attendance_date: input.attendanceDate,
    status: input.status,
    day_wage: dayWage,
    overtime_hours: input.overtimeHours,
    piece_work: input.pieceWork || null,
    pieces: input.pieces,
    rate_per_piece: input.ratePerPiece,
  };
}

export async function createLabourAttendance(input: LabourAttendanceInput): Promise<ActionResult<{ id: string }>> {
  const parsed = labourAttendanceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  const { data: worker, error: workerError } = await supabase
    .from("workers")
    .select("daily_wage")
    .eq("id", parsed.data.workerId)
    .single();
  if (workerError) return { error: workerError.message };

  const { data, error } = await supabase
    .from("labour_attendance")
    .insert({ organization_id: ctx.organizationId, ...toRow(parsed.data, worker.daily_wage) })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/labour-payment");
  return { error: null, data: { id: data.id } };
}

export async function updateLabourAttendance(attendanceId: string, input: LabourAttendanceInput): Promise<ActionResult> {
  const parsed = labourAttendanceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  const { data: worker, error: workerError } = await supabase
    .from("workers")
    .select("daily_wage")
    .eq("id", parsed.data.workerId)
    .single();
  if (workerError) return { error: workerError.message };

  const { error } = await supabase
    .from("labour_attendance")
    .update(toRow(parsed.data, worker.daily_wage))
    .eq("id", attendanceId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath("/labour-payment");
  return { error: null, data: undefined };
}
