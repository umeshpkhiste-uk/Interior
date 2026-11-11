import { z } from "zod";

export const PROPERTY_TYPES = [
  "apartment",
  "villa",
  "independent_house",
  "office",
  "commercial",
] as const;

export const clientSchema = z.object({
  name: z.string().min(2, "Enter the client's name"),
  mobile: z.string().trim().optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  alternateContact: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  city: z.string().trim().optional().or(z.literal("")),
  state: z.string().trim().optional().or(z.literal("")),
  pinCode: z.string().trim().optional().or(z.literal("")),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientSchema>;
