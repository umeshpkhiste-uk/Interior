import { z } from "zod";

export const LEAD_SOURCES = [
  "referral",
  "social_media",
  "website",
  "past_client",
  "builder_tie_up",
  "signboard",
  "exhibition",
  "walk_in",
  "other",
] as const;

export const LEAD_SOURCE_LABELS: Record<(typeof LEAD_SOURCES)[number], string> = {
  referral: "Referral",
  social_media: "Social media",
  website: "Website",
  past_client: "Past client",
  builder_tie_up: "Builder tie-up",
  signboard: "Signboard",
  exhibition: "Exhibition",
  walk_in: "Walk-in",
  other: "Other",
};

export const LEAD_STAGES = [
  "new",
  "site_visit_done",
  "design_shared",
  "quotation_sent",
  "negotiation",
  "won",
  "lost",
] as const;

export const LEAD_STAGE_LABELS: Record<(typeof LEAD_STAGES)[number], string> = {
  new: "New",
  site_visit_done: "Site visit done",
  design_shared: "Design shared",
  quotation_sent: "Quotation sent",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

const optionalNumber = z
  .union([z.number(), z.nan()])
  .optional()
  .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v));

export const leadSchema = z.object({
  enquiryDate: z.string().trim().min(1, "Enter the enquiry date"),
  clientName: z.string().min(2, "Enter the client's name"),
  phone: z.string().trim().optional().or(z.literal("")),
  area: z.string().trim().optional().or(z.literal("")),
  source: z.enum(LEAD_SOURCES),
  propertyType: z.string().trim().optional().or(z.literal("")),
  budget: optionalNumber.pipe(z.number().min(0).optional()),
  stage: z.enum(LEAD_STAGES),
  nextFollowupDate: z.string().trim().optional().or(z.literal("")),
  custom1: z.string().trim().optional().or(z.literal("")),
  custom2: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type LeadInput = z.infer<typeof leadSchema>;
