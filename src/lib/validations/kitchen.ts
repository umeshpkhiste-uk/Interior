import { z } from "zod";

export const KITCHEN_LAYOUT_TYPES = ["straight", "l_shaped", "u_shaped", "parallel", "island"] as const;
export const KITCHEN_LAYOUT_LABELS: Record<(typeof KITCHEN_LAYOUT_TYPES)[number], string> = {
  straight: "Straight",
  l_shaped: "L-Shaped",
  u_shaped: "U-Shaped",
  parallel: "Parallel",
  island: "Island",
};

export const kitchenEstimationSchema = z.object({
  layoutType: z.enum(KITCHEN_LAYOUT_TYPES),
  baseRft: z.number().min(0),
  wallRft: z.number().min(0),
  tallQty: z.number().int().min(0),
  cornerQty: z.number().int().min(0),
  baseRate: z.number().min(0),
  wallRate: z.number().min(0),
  tallRate: z.number().min(0),
  cornerRate: z.number().min(0),
  countertopArea: z.number().min(0),
  countertopRate: z.number().min(0),
  installLabourPct: z.number().min(0).max(100),
  wastagePct: z.number().min(0).max(100),
  marginPct: z.number().min(0).max(99),
  roundingUnit: z.number().min(1),
});

export type KitchenEstimationInput = z.infer<typeof kitchenEstimationSchema>;

export const kitchenAccessorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  qty: z.number().min(0),
  rate: z.number().min(0),
});

export type KitchenAccessoryInput = z.infer<typeof kitchenAccessorySchema>;
