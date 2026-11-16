"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { vendorPaymentSchema, type VendorPaymentInput } from "@/lib/validations/vendor-payment";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: VendorPaymentInput) {
  return {
    vendor_id: input.vendorId,
    payment_date: input.paymentDate,
    amount: input.amount,
    mode: input.mode,
    reference: input.reference || null,
  };
}

export async function createVendorPayment(
  input: VendorPaymentInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = vendorPaymentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendor_payments")
    .insert({ organization_id: ctx.organizationId, ...toRow(parsed.data) })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/material-purchase");
  return { error: null, data: { id: data.id } };
}

export async function updateVendorPayment(
  paymentId: string,
  input: VendorPaymentInput
): Promise<ActionResult> {
  const parsed = vendorPaymentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendor_payments")
    .update(toRow(parsed.data))
    .eq("id", paymentId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/material-purchase");
  return { error: null, data: undefined };
}
