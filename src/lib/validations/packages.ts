import { z } from "zod";

export const PACKAGE_TIERS = ["basic", "premium", "luxury"] as const;
export const PACKAGE_TIER_LABELS: Record<(typeof PACKAGE_TIERS)[number], string> = {
  basic: "Basic",
  premium: "Premium",
  luxury: "Luxury",
};

export const PACKAGE_COMPONENT_TYPES = [
  "kitchen", "wardrobe", "ceiling", "flooring", "painting", "electrical", "lighting", "other",
] as const;
export const PACKAGE_COMPONENT_LABELS: Record<(typeof PACKAGE_COMPONENT_TYPES)[number], string> = {
  kitchen: "Kitchen",
  wardrobe: "Wardrobe",
  ceiling: "False Ceiling",
  flooring: "Flooring",
  painting: "Painting",
  electrical: "Electrical",
  lighting: "Lighting",
  other: "Other",
};

export const packageComponentSchema = z.object({
  component: z.enum(PACKAGE_COMPONENT_TYPES),
  ratePerSqft: z.number().min(0),
  specText: z.string().optional().or(z.literal("")),
  brandOptions: z.string().optional().or(z.literal("")),
});

export type PackageComponentInput = z.infer<typeof packageComponentSchema>;

export const packageSettingsSchema = z.object({
  roundStep: z.number().min(0),
});

export type PackageSettingsInput = z.infer<typeof packageSettingsSchema>;
