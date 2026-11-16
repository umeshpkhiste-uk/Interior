import { z } from "zod";

export const materialCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  parentCategoryId: z.string().uuid().optional().or(z.literal("")),
});
export type MaterialCategoryInput = z.infer<typeof materialCategorySchema>;

export const materialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  unit: z.string().min(1, "Unit is required"),
  description: z.string().optional().or(z.literal("")),
});
export type MaterialInput = z.infer<typeof materialSchema>;

export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional().or(z.literal("")),
  creditDays: z
    .union([z.number(), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v))
    .pipe(z.number().int().min(0).optional()),
  contactPhone: z.string().optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});
export type SupplierInput = z.infer<typeof supplierSchema>;
