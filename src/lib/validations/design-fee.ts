import { z } from "zod";

export const DESIGN_FEE_BASES = ["percent", "per_sqft", "fixed"] as const;
export const DESIGN_FEE_BASIS_LABELS: Record<(typeof DESIGN_FEE_BASES)[number], string> = {
  percent: "% of Project Value",
  per_sqft: "Per Sq.Ft.",
  fixed: "Fixed Fee",
};

export const designFeeSchema = z.object({
  basis: z.enum(DESIGN_FEE_BASES),
  feePct: z.number().min(0).max(100),
  feePerSqft: z.number().min(0),
  fixedFee: z.number().min(0),
  includedVisits: z.number().int().min(0),
  additionalVisits: z.number().int().min(0),
  additionalVisitRate: z.number().min(0),
  gstPct: z.number().min(0).max(100),
});

export type DesignFeeInput = z.infer<typeof designFeeSchema>;

export const designFeeStageSchema = z.object({
  stageName: z.string().min(1, "Stage name is required"),
  stagePct: z.number().min(0).max(100),
});

export type DesignFeeStageInput = z.infer<typeof designFeeStageSchema>;
