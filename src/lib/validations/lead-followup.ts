import { z } from "zod";

export const LEAD_FOLLOWUP_CHANNELS = [
  "call",
  "site_visit",
  "studio_meeting",
  "message",
  "email",
  "other",
] as const;

export const LEAD_FOLLOWUP_CHANNEL_LABELS: Record<(typeof LEAD_FOLLOWUP_CHANNELS)[number], string> = {
  call: "Call",
  site_visit: "Site visit",
  studio_meeting: "Studio meeting",
  message: "Message",
  email: "Email",
  other: "Other",
};

export const leadFollowupSchema = z.object({
  leadId: z.string().uuid("Select a lead"),
  followupDate: z.string().trim().min(1, "Enter the follow-up date"),
  channel: z.enum(LEAD_FOLLOWUP_CHANNELS),
  handledBy: z.string().trim().optional().or(z.literal("")),
  outcome: z.string().trim().optional().or(z.literal("")),
});

export type LeadFollowupInput = z.infer<typeof leadFollowupSchema>;
