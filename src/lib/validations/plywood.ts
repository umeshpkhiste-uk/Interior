import { z } from "zod";

export const panelCutRowSchema = z.object({
  panelLength: z.number().min(0.01),
  panelWidth: z.number().min(0.01),
  qty: z.number().int().min(1),
  boardGrade: z.string().min(1, "Board grade is required"),
  plywoodThickness: z.string().optional().or(z.literal("")),
  laminateType: z.string().optional().or(z.literal("")),
  laminateThickness: z.string().optional().or(z.literal("")),
  laminateFaces: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  hasEdgeBand: z.boolean(),
  wastagePct: z.number().min(0).max(100),
});

export type PanelCutRowInput = z.infer<typeof panelCutRowSchema>;

export const plywoodRateSchema = z.object({
  boardGrade: z.string().min(1, "Board grade is required"),
  ratePerSheet: z.number().min(0),
  sheetLength: z.number().min(0.01),
  sheetWidth: z.number().min(0.01),
});

export type PlywoodRateInput = z.infer<typeof plywoodRateSchema>;

export const plywoodProjectSettingsSchema = z.object({
  laminateRatePerSheet: z.number().min(0),
  edgeBandRatePerRft: z.number().min(0),
  fixingsPct: z.number().min(0).max(100),
  marginPct: z.number().min(0).max(99),
  roundingUnit: z.number().min(1),
});

export type PlywoodProjectSettingsInput = z.infer<typeof plywoodProjectSettingsSchema>;
