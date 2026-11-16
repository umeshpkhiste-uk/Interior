import { z } from "zod";

export const LABOUR_ATTENDANCE_STATUSES = ["full_day", "half_day", "piece_work_only", "absent"] as const;

export const LABOUR_ATTENDANCE_STATUS_LABELS: Record<(typeof LABOUR_ATTENDANCE_STATUSES)[number], string> = {
  full_day: "Full day",
  half_day: "Half day",
  piece_work_only: "Piece work only",
  absent: "Absent",
};

export const labourAttendanceSchema = z.object({
  workerId: z.string().uuid("Select a worker"),
  projectId: z.string().uuid().optional().or(z.literal("")),
  attendanceDate: z.string().trim().min(1, "Enter the date"),
  status: z.enum(LABOUR_ATTENDANCE_STATUSES),
  overtimeHours: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? 0 : Math.max(0, v))),
  pieceWork: z.string().optional().or(z.literal("")),
  pieces: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? null : v))
    .nullable(),
  ratePerPiece: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? null : v))
    .nullable(),
});

export type LabourAttendanceInput = z.infer<typeof labourAttendanceSchema>;
