import { z } from "zod";

export const INSPIRATION_CATEGORIES = [
  "living_room", "bedroom", "modular_kitchen", "bathroom", "dining_room",
  "wardrobe", "false_ceiling", "lighting", "flooring", "wallpaper", "office_interiors",
] as const;

export const INSPIRATION_CATEGORY_LABELS: Record<string, string> = {
  living_room: "Living Room",
  bedroom: "Bedroom",
  modular_kitchen: "Modular Kitchen",
  bathroom: "Bathroom",
  dining_room: "Dining Room",
  wardrobe: "Wardrobe",
  false_ceiling: "False Ceiling",
  lighting: "Lighting",
  flooring: "Flooring",
  wallpaper: "Wallpaper",
  office_interiors: "Office Interiors",
};

export const moodboardSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().optional().or(z.literal("")),
});
export type MoodboardInput = z.infer<typeof moodboardSchema>;

export const inspirationImageMetaSchema = z.object({
  category: z.enum(INSPIRATION_CATEGORIES),
  roomId: z.string().uuid().optional().or(z.literal("")),
  moodboardId: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  materialSpecification: z.string().optional().or(z.literal("")),
});
export type InspirationImageMetaInput = z.infer<typeof inspirationImageMetaSchema>;
