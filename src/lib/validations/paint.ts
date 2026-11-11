import { z } from "zod";

export const paintEstimationSchema = z.object({
  roomId: z.string().uuid().optional().or(z.literal("")),
  netWallArea: z.number().min(0),
  ceilingArea: z.number().min(0),
  featureWallArea: z.number().min(0),
  coats: z.number().int().min(0),
  paintCoveragePerLitre: z.number().min(0.01),
  primerCoverage: z.number().min(0.01),
  puttyCoverage: z.number().min(0.01),
  canSize: z.number().min(0.01),
  paintRate: z.number().min(0),
  primerRate: z.number().min(0),
  puttyRate: z.number().min(0),
  labourRate: z.number().min(0),
  wallpaperRollLength: z.number().min(0.01),
  wallpaperRollWidth: z.number().min(0.01),
  wallpaperRate: z.number().min(0),
  wallpaperFixingRate: z.number().min(0),
  wastagePct: z.number().min(0).max(100),
  paintBrand: z.string().optional().or(z.literal("")),
  finishType: z.string().optional().or(z.literal("")),
  marginPct: z.number().min(0).max(99),
  roundingUnit: z.number().min(1),
});

export type PaintEstimationInput = z.infer<typeof paintEstimationSchema>;
