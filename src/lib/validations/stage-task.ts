import { z } from "zod";

export const stageTaskSchema = z.object({
  projectId: z.string().uuid("Select a project"),
  stage: z.string().min(1, "Enter the stage"),
  task: z.string().min(1, "Enter the task"),
  doneBy: z.string().trim().optional().or(z.literal("")),
  plannedDate: z.string().trim().optional().or(z.literal("")),
  doneOn: z.string().trim().optional().or(z.literal("")),
});

export type StageTaskInput = z.infer<typeof stageTaskSchema>;
