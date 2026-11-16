import { z } from "zod";

export const HANDOVER_CHECK_RESULTS = ["ok", "needs_work"] as const;

export const HANDOVER_CHECK_RESULT_LABELS: Record<(typeof HANDOVER_CHECK_RESULTS)[number], string> = {
  ok: "OK",
  needs_work: "Needs work",
};

export const handoverCheckSchema = z.object({
  projectId: z.string().uuid("Select a project"),
  roomArea: z.string().trim().optional().or(z.literal("")),
  checkItem: z.string().min(1, "Enter the check"),
  checkedBy: z.string().trim().optional().or(z.literal("")),
  checkedOn: z.string().trim().optional().or(z.literal("")),
  result: z.enum(HANDOVER_CHECK_RESULTS).optional(),
});

export type HandoverCheckInput = z.infer<typeof handoverCheckSchema>;
