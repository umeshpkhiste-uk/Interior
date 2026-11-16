import { z } from "zod";

export const VENDOR_PAYMENT_MODES = ["cash", "upi", "bank_transfer", "cheque", "other"] as const;

export const VENDOR_PAYMENT_MODE_LABELS: Record<(typeof VENDOR_PAYMENT_MODES)[number], string> = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
  other: "Other",
};

export const vendorPaymentSchema = z.object({
  vendorId: z.string().uuid("Select a vendor"),
  paymentDate: z.string().trim().min(1, "Enter the payment date"),
  amount: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? -1 : v))
    .pipe(z.number().positive("Enter the amount")),
  mode: z.enum(VENDOR_PAYMENT_MODES),
  reference: z.string().trim().optional().or(z.literal("")),
});

export type VendorPaymentInput = z.infer<typeof vendorPaymentSchema>;
