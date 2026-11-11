import { z } from "zod";

export const FLOORING_TYPES = [
  "vitrified", "ceramic", "marble", "granite", "wooden", "vinyl", "laminate", "spc", "no_work",
] as const;
export const FLOORING_TYPE_LABELS: Record<(typeof FLOORING_TYPES)[number], string> = {
  vitrified: "Vitrified Tiles",
  ceramic: "Ceramic Tiles",
  marble: "Marble",
  granite: "Granite",
  wooden: "Wooden",
  vinyl: "Vinyl",
  laminate: "Laminate",
  spc: "SPC",
  no_work: "No Work",
};

export const flooringEstimationSchema = z.object({
  flooringType: z.enum(FLOORING_TYPES),
  tileLength: z.number().min(0),
  tileWidth: z.number().min(0),
  pricePerBox: z.number().min(0),
  piecesPerBox: z.number().int().min(0),
  wastagePct: z.number().min(0).max(100),
  layingLabourRate: z.number().min(0),
  adhesiveGroutRate: z.number().min(0),
  skirtingLength: z.number().min(0),
  skirtingRate: z.number().min(0),
  marginPct: z.number().min(0).max(99),
  roundingUnit: z.number().min(1),
});

export type FlooringEstimationInput = z.infer<typeof flooringEstimationSchema>;
