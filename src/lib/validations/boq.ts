import { z } from "zod";

export const boqItemSchema = z.object({
  roomId: z.string().uuid().optional().or(z.literal("")),
  workCategory: z.string().optional().or(z.literal("")),
  itemDescription: z.string().min(1, "Description is required"),
  specification: z.string().optional().or(z.literal("")),
  brand: z.string().optional().or(z.literal("")),
  unit: z.string().optional().or(z.literal("")),
  quantity: z.number().min(0),
  materialRate: z.number().min(0),
  labourRate: z.number().min(0),
});

export type BoqItemInput = z.infer<typeof boqItemSchema>;

export const boqSettingsSchema = z.object({
  contingencyPct: z.number().min(0).max(100),
  gstPct: z.number().min(0).max(100),
});

export type BoqSettingsInput = z.infer<typeof boqSettingsSchema>;
