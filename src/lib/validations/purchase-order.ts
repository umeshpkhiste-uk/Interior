import { z } from "zod";

export const PURCHASE_DELIVERY_STATUSES = ["pending", "delivered"] as const;

export const PURCHASE_DELIVERY_STATUS_LABELS: Record<(typeof PURCHASE_DELIVERY_STATUSES)[number], string> = {
  pending: "Pending",
  delivered: "Delivered",
};

export const purchaseOrderSchema = z.object({
  vendorId: z.string().uuid("Select a vendor"),
  projectId: z.string().uuid().optional().or(z.literal("")),
  orderDate: z.string().trim().min(1, "Enter the order date"),
  item: z.string().min(1, "Enter the item"),
  unit: z.string().min(1, "Enter the unit"),
  qty: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? -1 : v))
    .pipe(z.number().positive("Enter the quantity")),
  rate: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? -1 : v))
    .pipe(z.number().min(0, "Enter the rate")),
  gstPct: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? 0 : Math.min(100, Math.max(0, v)))),
  deliveryStatus: z.enum(PURCHASE_DELIVERY_STATUSES),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
