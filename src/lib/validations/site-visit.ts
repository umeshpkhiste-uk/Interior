import { z } from "zod";

const optionalNumber = z
  .union([z.number(), z.nan()])
  .optional()
  .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v));

export const siteVisitSchema = z.object({
  projectId: z.string().uuid("Select a project"),
  visitDate: z.string().trim().min(1, "Enter the visit date"),
  visitedBy: z.string().trim().optional().or(z.literal("")),
  purpose: z.string().trim().optional().or(z.literal("")),
  workDonePct: optionalNumber.pipe(z.number().min(0).max(100).optional()),
  notes: z.string().trim().optional().or(z.literal("")),
  nextVisitInDays: optionalNumber.pipe(z.number().int().min(0).optional()),
});

export type SiteVisitInput = z.infer<typeof siteVisitSchema>;
