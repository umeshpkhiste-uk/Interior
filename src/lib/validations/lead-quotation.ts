import { z } from "zod";

export const LEAD_QUOTATION_STATUSES = [
  "sent",
  "revised",
  "accepted",
  "declined",
  "superseded",
] as const;

export const LEAD_QUOTATION_STATUS_LABELS: Record<(typeof LEAD_QUOTATION_STATUSES)[number], string> = {
  sent: "Sent",
  revised: "Revised",
  accepted: "Accepted",
  declined: "Declined",
  superseded: "Superseded",
};

export const leadQuotationSchema = z.object({
  leadId: z.string().uuid("Select a lead"),
  quoteDate: z.string().trim().min(1, "Enter the quotation date"),
  quotedAmount: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? -1 : v))
    .pipe(z.number().min(0, "Enter the quoted amount")),
  discountPct: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? 0 : Math.min(100, Math.max(0, v)))),
  status: z.enum(LEAD_QUOTATION_STATUSES),
});

export type LeadQuotationInput = z.infer<typeof leadQuotationSchema>;
