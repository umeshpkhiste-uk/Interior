import { z } from "zod";

export const FURNITURE_TYPES = [
  "bed", "side_table", "wardrobe", "sofa", "coffee_table", "tv_unit", "dining_set", "study_table",
  "counter_straight", "counter_l", "sink", "hob", "wc", "basin", "washer", "rug", "plant",
  "armchair", "bathtub", "shower", "car", "stairs",
] as const;

export type FurnitureType = (typeof FURNITURE_TYPES)[number];

export const FURNITURE_LABELS: Record<FurnitureType, string> = {
  bed: "Bed",
  side_table: "Side table",
  wardrobe: "Wardrobe",
  sofa: "Sofa",
  coffee_table: "Coffee table",
  tv_unit: "TV unit",
  dining_set: "Dining set",
  study_table: "Study table",
  counter_straight: "Kitchen platform (straight)",
  counter_l: "Kitchen platform (L-shape)",
  sink: "Sink",
  hob: "Hob",
  wc: "WC",
  basin: "Wash basin",
  washer: "Washing machine",
  rug: "Rug",
  plant: "Plant",
  armchair: "Armchair",
  bathtub: "Bathtub",
  shower: "Shower area",
  car: "Car",
  stairs: "Staircase",
};

/** Default own size (w along x, h along y) in feet. */
export const FURNITURE_SIZES: Record<FurnitureType, { w: number; h: number }> = {
  bed: { w: 5, h: 6.5 },
  side_table: { w: 1.4, h: 1.4 },
  wardrobe: { w: 6, h: 2 },
  sofa: { w: 7, h: 2.8 },
  coffee_table: { w: 3, h: 2.2 },
  tv_unit: { w: 5, h: 1.2 },
  dining_set: { w: 6, h: 5.8 },
  study_table: { w: 4, h: 2 },
  counter_straight: { w: 8, h: 2 },
  counter_l: { w: 8, h: 6 },
  sink: { w: 2.4, h: 1.5 },
  hob: { w: 1.8, h: 1.8 },
  wc: { w: 1.6, h: 2.5 },
  basin: { w: 1.6, h: 1.2 },
  washer: { w: 2.2, h: 2.2 },
  rug: { w: 6, h: 5 },
  plant: { w: 1.2, h: 1.2 },
  armchair: { w: 2.6, h: 2.6 },
  bathtub: { w: 5.5, h: 2.5 },
  shower: { w: 3, h: 3 },
  car: { w: 6, h: 14.5 },
  stairs: { w: 3.5, h: 10 },
};

export const PLAN_WALLS = ["top", "right", "bottom", "left"] as const;

export const passageSchema = z.object({
  top: z.number().min(0).max(50),
  right: z.number().min(0).max(50),
  bottom: z.number().min(0).max(50),
  left: z.number().min(0).max(50),
});

export type PlanPassage = z.infer<typeof passageSchema>;
export const NO_PASSAGE: PlanPassage = { top: 0, right: 0, bottom: 0, left: 0 };

export const rotationSchema = z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]);

export const furnitureItemSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(FURNITURE_TYPES),
  x: z.number().finite(),
  y: z.number().finite(),
  w: z.number().positive().max(100),
  h: z.number().positive().max(100),
  rotation: rotationSchema,
});

export type FurnitureItem = z.infer<typeof furnitureItemSchema>;

export const floorPlanSaveSchema = z.object({
  passage: passageSchema,
  rooms: z
    .array(
      z.object({
        id: z.string().uuid(),
        x: z.number().finite(),
        y: z.number().finite(),
        rotation: rotationSchema,
        openWalls: z.array(z.enum(PLAN_WALLS)).max(4),
        furniture: z.array(furnitureItemSchema).max(60),
        /** Present only when the room's size was changed on the plan; in the room's own unit. */
        size: z.object({ length: z.number().positive(), width: z.number().positive() }).optional(),
      })
    )
    .max(200),
});

export type FloorPlanSaveInput = z.infer<typeof floorPlanSaveSchema>;
