import { z } from "zod";

export const invoiceSchema = z.object({
  projectId: z.string().uuid("Select a project"),
  invoiceDate: z.string().trim().min(1, "Enter the invoice date"),
  milestone: z.string().min(1, "Enter the milestone"),
  amount: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? -1 : v))
    .pipe(z.number().positive("Enter the invoice amount")),
  gstPct: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? 0 : Math.min(100, Math.max(0, v)))),
  dueDate: z.string().trim().optional().or(z.literal("")),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
