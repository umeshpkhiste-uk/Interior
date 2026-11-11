import { z } from "zod";

export const CEILING_TYPES = ["gypsum", "pop", "grid", "pvc", "wooden", "other"] as const;
export const CEILING_TYPE_LABELS: Record<(typeof CEILING_TYPES)[number], string> = {
  gypsum: "Gypsum",
  pop: "POP",
  grid: "Grid",
  pvc: "PVC",
  wooden: "Wooden",
  other: "Other",
};

export const CEILING_DESIGNS = ["cove", "peripheral", "none"] as const;
export const CEILING_DESIGN_LABELS: Record<(typeof CEILING_DESIGNS)[number], string> = {
  cove: "Cove",
  peripheral: "Peripheral",
  none: "None",
};

export const ceilingEstimationSchema = z.object({
  ceilingType: z.enum(CEILING_TYPES),
  coverPct: z.number().min(0).max(100),
  design: z.enum(CEILING_DESIGNS),
  coveLength: z.number().min(0),
  ledStripLength: z.number().min(0),
  downlightQty: z.number().int().min(0),
  materialRate: z.number().min(0),
  labourRate: z.number().min(0),
  boardDimensions: z.string().optional().or(z.literal("")),
  wastagePct: z.number().min(0).max(100),
  lightingRate: z.number().min(0),
  ledStripRate: z.number().min(0),
  coveLabourRate: z.number().min(0),
  marginPct: z.number().min(0).max(99),
  roundingUnit: z.number().min(1),
});

export type CeilingEstimationInput = z.infer<typeof ceilingEstimationSchema>;
