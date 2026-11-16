import { z } from "zod";

export const CLIENT_APPROVAL_CHANNELS = [
  "signed_drawing",
  "message",
  "email",
  "in_person",
  "other",
] as const;

export const CLIENT_APPROVAL_CHANNEL_LABELS: Record<(typeof CLIENT_APPROVAL_CHANNELS)[number], string> = {
  signed_drawing: "Signed drawing",
  message: "Message",
  email: "Email",
  in_person: "In person",
  other: "Other",
};

export const clientApprovalSchema = z.object({
  projectId: z.string().uuid("Select a project"),
  approvalFor: z.string().min(1, "Enter what this approval is for"),
  roomArea: z.string().trim().optional().or(z.literal("")),
  sentOn: z.string().trim().min(1, "Enter the sent date"),
  approvedOn: z.string().trim().optional().or(z.literal("")),
  approvedBy: z.string().trim().optional().or(z.literal("")),
  channel: z.enum(CLIENT_APPROVAL_CHANNELS).optional(),
});

export type ClientApprovalInput = z.infer<typeof clientApprovalSchema>;
