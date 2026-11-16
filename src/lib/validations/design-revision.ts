import { z } from "zod";

export const DESIGN_REVISION_REPLY_STATUSES = ["waiting", "approved", "changes_requested"] as const;

export const DESIGN_REVISION_REPLY_STATUS_LABELS: Record<
  (typeof DESIGN_REVISION_REPLY_STATUSES)[number],
  string
> = {
  waiting: "Waiting",
  approved: "Approved",
  changes_requested: "Changes requested",
};

export const designRevisionSchema = z.object({
  projectId: z.string().uuid("Select a project"),
  roomArea: z.string().trim().optional().or(z.literal("")),
  drawing: z.string().min(1, "Enter the drawing name"),
  version: z.string().trim().min(1, "Enter the version"),
  clientAskedFor: z.string().trim().optional().or(z.literal("")),
  sentOn: z.string().trim().min(1, "Enter the sent date"),
  replyOn: z.string().trim().optional().or(z.literal("")),
  replyStatus: z.enum(DESIGN_REVISION_REPLY_STATUSES),
});

export type DesignRevisionInput = z.infer<typeof designRevisionSchema>;
