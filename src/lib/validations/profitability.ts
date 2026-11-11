import { z } from "zod";

export const projectSettingsSchema = z.object({
  overheadPct: z.number().min(0).max(100),
  supervisorMonthlyCost: z.number().min(0),
  projectDurationMonths: z.number().min(0),
  targetMarginPct: z.number().min(0).max(100),
  otherHeadMaterialCost: z.number().min(0),
  otherHeadLabourCost: z.number().min(0),
});
export type ProjectSettingsInput = z.infer<typeof projectSettingsSchema>;
