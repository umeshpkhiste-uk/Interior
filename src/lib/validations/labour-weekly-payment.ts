import { z } from "zod";

export const LABOUR_PAYMENT_MODES = ["cash", "upi", "bank_transfer"] as const;

export const LABOUR_PAYMENT_MODE_LABELS: Record<(typeof LABOUR_PAYMENT_MODES)[number], string> = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank transfer",
};

export const labourWeeklyPaymentSchema = z.object({
  workerId: z.string().uuid("Select a worker"),
  weekStarting: z.string().trim().min(1, "Enter the week start date"),
  advanceRecovered: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? 0 : Math.max(0, v))),
  paid: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? 0 : Math.max(0, v))),
  mode: z.enum(LABOUR_PAYMENT_MODES),
});

export type LabourWeeklyPaymentInput = z.infer<typeof labourWeeklyPaymentSchema>;
