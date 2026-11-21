import { z } from "zod";
import { ROOM_CATEGORIES } from "@/lib/validations/room";

export const FURNITURE_TYPES = [
  "bed", "side_table", "wardrobe", "sofa", "coffee_table", "tv_unit", "dining_set", "study_table",
  "counter_straight", "counter_l", "sink", "hob", "wc", "basin", "washer", "rug", "plant",
  "armchair", "bathtub", "shower", "car", "stairs", "partition", "breakfast_counter", "mandir",
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
  partition: "Wooden partition",
  breakfast_counter: "Breakfast counter",
  mandir: "Mandir",
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
  partition: { w: 6, h: 0.5 },
  breakfast_counter: { w: 5, h: 1.6 },
  mandir: { w: 3, h: 1.6 },
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

/** A piece of wall removed on the plan, in the room's own frame (see FloorPlanRoom.wallGaps). */
export const wallGapSchema = z
  .object({
    wall: z.enum(PLAN_WALLS),
    from: z.number().min(0).max(500),
    to: z.number().min(0).max(500),
  })
  .refine((g) => g.to > g.from, "A wall gap must have a length");

export type WallGap = z.infer<typeof wallGapSchema>;

/** Wall-mounted designs that can be put on a design wall in the 3D view. */
export const WALL_DESIGNS = ["shelves", "display_unit"] as const;
export type WallDesignType = (typeof WALL_DESIGNS)[number];
export const WALL_DESIGN_LABELS: Record<WallDesignType, string> = {
  shelves: "Floating shelves",
  display_unit: "Display unit",
};

/** A design wall: one of the room's own walls, always shown full height in 3D, with an optional design. */
export const wallDesignSchema = z.object({
  wall: z.enum(PLAN_WALLS),
  design: z.enum(WALL_DESIGNS).nullable(),
});

export type WallDesign = z.infer<typeof wallDesignSchema>;

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
        wallGaps: z.array(wallGapSchema).max(60),
        furniture: z.array(furnitureItemSchema).max(60),
        /** Present only when the room's size was changed on the plan; in the room's own unit. */
        size: z.object({ length: z.number().positive(), width: z.number().positive() }).optional(),
      })
    )
    .max(200),
  /** Doors/windows moved or resized on the plan. widthFt only when the width changed. */
  openings: z
    .array(
      z.object({
        id: z.string().uuid(),
        roomId: z.string().uuid(),
        wall: z.enum(PLAN_WALLS),
        offset: z.number().min(0).max(500),
        swing: z.number().int().min(0).max(3),
        fullHeight: z.boolean(),
        widthFt: z.number().positive().max(30).optional(),
      })
    )
    .max(500),
  /** Doors/windows that sat on a removed wall piece; they are deleted. */
  removedOpenings: z
    .array(z.object({ id: z.string().uuid(), roomId: z.string().uuid() }))
    .max(500)
    .default([]),
});

export type FloorPlanSaveInput = z.infer<typeof floorPlanSaveSchema>;

/** Spaces that can be added straight from the 2D plan, with their starting size in feet. */
export const PLAN_AREA_PRESETS = [
  { key: "passage", category: "passage", label: "Passage", lengthFt: 3, widthFt: 10 },
  { key: "wc", category: "bathroom", label: "WC / Toilet", lengthFt: 4, widthFt: 5 },
  { key: "balcony", category: "balcony", label: "Balcony", lengthFt: 10, widthFt: 4 },
  { key: "utility", category: "utility", label: "Utility", lengthFt: 6, widthFt: 4 },
  { key: "store", category: "store_room", label: "Store room", lengthFt: 5, widthFt: 5 },
  { key: "lobby", category: "lobby", label: "Lobby / Foyer", lengthFt: 6, widthFt: 6 },
] as const;

export const newAreaSchema = z.object({
  category: z.enum(ROOM_CATEGORIES),
  name: z.string().trim().min(1).max(60),
  lengthFt: z.number().positive().max(200),
  widthFt: z.number().positive().max(200),
  x: z.number().finite(),
  y: z.number().finite(),
});

export type NewAreaInput = z.infer<typeof newAreaSchema>;

export const newOpeningSchema = z.object({
  roomId: z.string().uuid(),
  type: z.enum(["door", "window"]),
  widthFt: z.number().positive().max(30),
  heightFt: z.number().positive().max(30),
  wall: z.enum(PLAN_WALLS),
  offset: z.number().min(0).max(500),
  fullHeight: z.boolean().optional(),
});

export type NewOpeningInput = z.infer<typeof newOpeningSchema>;

export const FLOOR_MATERIALS = [
  "wood", "walnut", "tile", "marble", "granite", "stone", "wetTile", "concrete", "carpet", "paver",
] as const;

export type FloorMaterial = (typeof FLOOR_MATERIALS)[number];

/** Display name and a representative colour for swatches. */
export const FLOOR_MATERIAL_INFO: Record<FloorMaterial, { label: string; swatch: string }> = {
  wood: { label: "Oak wood", swatch: "#c99b6b" },
  walnut: { label: "Walnut wood", swatch: "#6f4a2f" },
  tile: { label: "Vitrified tiles", swatch: "#f1ebe0" },
  marble: { label: "Italian marble", swatch: "#f4f2ee" },
  granite: { label: "Granite", swatch: "#3b3a3d" },
  stone: { label: "Natural stone", swatch: "#d6d3cc" },
  wetTile: { label: "Anti-skid tiles", swatch: "#c9cac7" },
  concrete: { label: "Polished concrete", swatch: "#8f949a" },
  carpet: { label: "Carpet", swatch: "#b9ad99" },
  paver: { label: "Paver blocks", swatch: "#8d9095" },
};

/** Curated interior paint shades offered as quick picks (any colour can still be chosen). */
export const PAINT_COLORS = [
  { name: "Ivory", hex: "#f4efe4" },
  { name: "Warm white", hex: "#efe8dc" },
  { name: "Sand", hex: "#e3d3b8" },
  { name: "Greige", hex: "#cfc6b8" },
  { name: "Sage", hex: "#b9c4a8" },
  { name: "Olive", hex: "#8f9670" },
  { name: "Powder blue", hex: "#bfd3de" },
  { name: "Navy", hex: "#2f4058" },
  { name: "Terracotta", hex: "#c8795a" },
  { name: "Blush", hex: "#e8c9c0" },
  { name: "Mustard", hex: "#d8ac4f" },
  { name: "Charcoal", hex: "#4a4a4d" },
] as const;

export const DEFAULT_WALL_COLOR = "#f1ede6";

export const roomFinishSchema = z.object({
  roomId: z.string().uuid(),
  wallColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
  floorMaterial: z.enum(FLOOR_MATERIALS).nullable(),
  wallDesigns: z.array(wallDesignSchema).max(4),
});

export type RoomFinishInput = z.infer<typeof roomFinishSchema>;
