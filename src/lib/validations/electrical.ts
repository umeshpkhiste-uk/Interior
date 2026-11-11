import { z } from "zod";

export const ELECTRICAL_POINT_TYPES = [
  "light", "fan", "socket_6a", "socket_16a", "ac", "tv", "data", "geyser",
  "profile_lighting", "db_mcb", "other",
] as const;
export const ELECTRICAL_POINT_TYPE_LABELS: Record<(typeof ELECTRICAL_POINT_TYPES)[number], string> = {
  light: "Light Point",
  fan: "Fan Point",
  socket_6a: "6A Socket",
  socket_16a: "16A Socket",
  ac: "AC Point",
  tv: "TV / Data Point",
  data: "Data / LAN Point",
  geyser: "Geyser Point",
  profile_lighting: "Profile Lighting (per rft)",
  db_mcb: "DB / MCB",
  other: "Other",
};

export const electricalPointSchema = z.object({
  pointType: z.enum(ELECTRICAL_POINT_TYPES),
  qty: z.number().min(0),
  allInRate: z.number().min(0),
  wiringSpec: z.string().optional().or(z.literal("")),
});

export type ElectricalPointInput = z.infer<typeof electricalPointSchema>;

export const electricalProjectSettingsSchema = z.object({
  dbMcbCost: z.number().min(0),
  labourSharePct: z.number().min(0).max(100),
  marginPct: z.number().min(0).max(99),
  roundingUnit: z.number().min(1),
});

export type ElectricalProjectSettingsInput = z.infer<typeof electricalProjectSettingsSchema>;
