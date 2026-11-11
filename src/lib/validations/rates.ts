import { z } from "zod";

const optionalNumber = z
  .union([z.number(), z.nan()])
  .optional()
  .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v));

export const materialRateSchema = z.object({
  materialId: z.string().uuid("Select a material"),
  supplierId: z.string().uuid().optional().or(z.literal("")),
  currentRate: z.number().min(0),
  effectiveDate: z.string().trim().optional().or(z.literal("")),
  plannedIncreasePct: z.number().min(0).max(1000),
  roundStep: z.number().min(0),
  monthlyVolume: z.number().min(0),
  marketLow: optionalNumber.pipe(z.number().min(0).optional()),
  marketHigh: optionalNumber.pipe(z.number().min(0).optional()),
  notes: z.string().optional().or(z.literal("")),
});
export type MaterialRateInput = z.infer<typeof materialRateSchema>;

export const reviseRateSchema = z.object({
  newRate: z.number().min(0),
  reason: z.string().optional().or(z.literal("")),
});
export type ReviseRateInput = z.infer<typeof reviseRateSchema>;
