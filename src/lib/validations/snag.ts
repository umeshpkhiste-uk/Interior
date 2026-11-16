import { z } from "zod";

export const snagSchema = z.object({
  projectId: z.string().uuid("Select a project"),
  roomArea: z.string().trim().optional().or(z.literal("")),
  item: z.string().min(1, "Enter the item"),
  issue: z.string().min(1, "Describe the issue"),
  foundOn: z.string().trim().min(1, "Enter the date found"),
  assignedTo: z.string().trim().optional().or(z.literal("")),
  fixBy: z.string().trim().optional().or(z.literal("")),
  fixedOn: z.string().trim().optional().or(z.literal("")),
});

export type SnagInput = z.infer<typeof snagSchema>;
