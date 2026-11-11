import { z } from "zod";

export const EXPENSE_CATEGORIES = ["material_purchase", "labour_payment", "transportation", "site_expense", "misc"] as const;
export const EXPENSE_CATEGORY_LABELS: Record<(typeof EXPENSE_CATEGORIES)[number], string> = {
  material_purchase: "Material Purchase",
  labour_payment: "Labour Payment",
  transportation: "Transportation",
  site_expense: "Site Expense",
  misc: "Miscellaneous",
};

export const expenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().optional().or(z.literal("")),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  expenseDate: z.string().trim().optional().or(z.literal("")),
});
export type ExpenseInput = z.infer<typeof expenseSchema>;

export const PAYMENT_DIRECTIONS = ["client_advance", "client_payment", "supplier_payment"] as const;
export const PAYMENT_DIRECTION_LABELS: Record<(typeof PAYMENT_DIRECTIONS)[number], string> = {
  client_advance: "Client Advance",
  client_payment: "Client Payment",
  supplier_payment: "Supplier Payment",
};

export const paymentSchema = z.object({
  direction: z.enum(PAYMENT_DIRECTIONS),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentDate: z.string().trim().optional().or(z.literal("")),
  method: z.string().optional().or(z.literal("")),
  referenceNote: z.string().optional().or(z.literal("")),
});
export type PaymentInput = z.infer<typeof paymentSchema>;
