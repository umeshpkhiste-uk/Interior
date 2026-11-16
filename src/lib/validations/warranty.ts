import { z } from "zod";

export const warrantySchema = z.object({
  projectId: z.string().uuid("Select a project"),
  item: z.string().min(1, "Enter the item"),
  handoverDate: z.string().trim().min(1, "Enter the handover date"),
  warrantyYears: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? -1 : v))
    .pipe(z.number().positive("Enter the warranty period in years")),
});

export type WarrantyInput = z.infer<typeof warrantySchema>;
