import { z } from "zod";

export const materialIssueSchema = z.object({
  projectId: z.string().uuid("Select a project"),
  purchaseOrderId: z.string().uuid().optional().or(z.literal("")),
  issueDate: z.string().trim().min(1, "Enter the issue date"),
  item: z.string().min(1, "Enter the item"),
  unit: z.string().min(1, "Enter the unit"),
  qty: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? -1 : v))
    .pipe(z.number().positive("Enter the quantity")),
  rate: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? -1 : v))
    .pipe(z.number().min(0, "Enter the rate")),
  issuedTo: z.string().trim().optional().or(z.literal("")),
});

export type MaterialIssueInput = z.infer<typeof materialIssueSchema>;
