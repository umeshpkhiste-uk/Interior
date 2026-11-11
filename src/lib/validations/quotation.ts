import { z } from "zod";

export const DISCOUNT_TYPES = ["percent", "fixed"] as const;
export const QUOTATION_STATUSES = ["draft", "sent", "viewed", "approved", "rejected", "expired"] as const;
export const QUOTATION_STATUS_LABELS: Record<(typeof QUOTATION_STATUSES)[number], string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
};

export const quotationSettingsSchema = z.object({
  validityDate: z.string().trim().optional().or(z.literal("")),
  discountType: z.enum(DISCOUNT_TYPES),
  discountValue: z.number().min(0),
  gstPct: z.number().min(0).max(100),
});

export type QuotationSettingsInput = z.infer<typeof quotationSettingsSchema>;

export const quotationItemSchema = z.object({
  roomLabel: z.string().optional().or(z.literal("")),
  itemDescription: z.string().min(1, "Description is required"),
  specification: z.string().optional().or(z.literal("")),
  unit: z.string().optional().or(z.literal("")),
  quantity: z.number().min(0),
  rate: z.number().min(0),
});

export type QuotationItemInput = z.infer<typeof quotationItemSchema>;

export const paymentStageSchema = z.object({
  stageName: z.string().min(1, "Stage name is required"),
  stagePct: z.number().min(0).max(100),
});

export type PaymentStageInput = z.infer<typeof paymentStageSchema>;
