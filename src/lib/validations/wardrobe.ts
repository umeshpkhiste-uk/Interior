import { z } from "zod";

export const SHUTTER_TYPES = ["hinged", "sliding", "open"] as const;
export const SHUTTER_TYPE_LABELS: Record<(typeof SHUTTER_TYPES)[number], string> = {
  hinged: "Hinged",
  sliding: "Sliding",
  open: "Open",
};

export const wardrobeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  roomId: z.string().uuid().optional().or(z.literal("")),
  width: z.number().min(0.01),
  height: z.number().min(0.01),
  depth: z.number().min(0),
  shutterType: z.enum(SHUTTER_TYPES),
  hingedRate: z.number().min(0),
  slidingRate: z.number().min(0),
  hasLoft: z.boolean(),
  loftHeight: z.number().min(0),
  loftRate: z.number().min(0),
  installLabourPct: z.number().min(0).max(100),
  marginPct: z.number().min(0).max(99),
  roundingUnit: z.number().min(1),
});

export type WardrobeInput = z.infer<typeof wardrobeSchema>;

export const WARDROBE_COMPONENT_TYPES = [
  "drawer", "hanging_rod", "shelf", "pull_out", "mirror", "other",
] as const;
export const WARDROBE_COMPONENT_LABELS: Record<(typeof WARDROBE_COMPONENT_TYPES)[number], string> = {
  drawer: "Drawer",
  hanging_rod: "Hanging Rod",
  shelf: "Shelf",
  pull_out: "Pull-out",
  mirror: "Mirror",
  other: "Other",
};

export const wardrobeComponentSchema = z.object({
  componentName: z.enum(WARDROBE_COMPONENT_TYPES),
  qty: z.number().min(0),
  rate: z.number().min(0),
});

export type WardrobeComponentInput = z.infer<typeof wardrobeComponentSchema>;
