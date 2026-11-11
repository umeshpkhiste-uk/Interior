import { z } from "zod";

export const ROOM_CATEGORIES = [
  "living_room", "dining_room", "master_bedroom", "bedroom_2", "bedroom_3",
  "kitchen", "bathroom", "balcony", "utility", "passage", "other",
] as const;

export const ROOM_CATEGORY_LABELS: Record<(typeof ROOM_CATEGORIES)[number], string> = {
  living_room: "Living Room",
  dining_room: "Dining Room",
  master_bedroom: "Master Bedroom",
  bedroom_2: "Bedroom 2",
  bedroom_3: "Bedroom 3",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  balcony: "Balcony",
  utility: "Utility",
  passage: "Passage",
  other: "Other",
};

export const UNIT_SYSTEMS = ["feet_inches", "metric"] as const;

export const roomSchema = z.object({
  roomName: z.string().min(1, "Room name is required"),
  roomCategory: z.enum(ROOM_CATEGORIES),
  unitSystem: z.enum(UNIT_SYSTEMS),
  length: z.number().min(0.01, "Length must be greater than 0"),
  width: z.number().min(0.01, "Width must be greater than 0"),
  height: z.number().min(0.01, "Height must be greater than 0"),
});

export type RoomInput = z.infer<typeof roomSchema>;

export const OPENING_TYPES = ["door", "window", "other"] as const;
export const OPENING_TYPE_LABELS: Record<(typeof OPENING_TYPES)[number], string> = {
  door: "Door",
  window: "Window",
  other: "Other",
};

export const openingSchema = z.object({
  openingType: z.enum(OPENING_TYPES),
  width: z.number().min(0, "Width must not be negative"),
  height: z.number().min(0, "Height must not be negative"),
  quantity: z.number().int().min(0, "Quantity must not be negative"),
});

export type OpeningInput = z.infer<typeof openingSchema>;
