import { z } from "zod";

export const labourAdvanceSchema = z.object({
  workerId: z.string().uuid("Select a worker"),
  advanceDate: z.string().trim().min(1, "Enter the date"),
  amount: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? -1 : v))
    .pipe(z.number().positive("Enter the advance amount")),
  reason: z.string().optional().or(z.literal("")),
});

export type LabourAdvanceInput = z.infer<typeof labourAdvanceSchema>;
