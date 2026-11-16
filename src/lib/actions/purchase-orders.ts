"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { purchaseOrderSchema, type PurchaseOrderInput } from "@/lib/validations/purchase-order";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: PurchaseOrderInput) {
  return {
    vendor_id: input.vendorId,
    project_id: input.projectId || null,
    order_date: input.orderDate,
    item: input.item,
    unit: input.unit,
    qty: input.qty,
    rate: input.rate,
    gst_pct: input.gstPct / 100,
    delivery_status: input.deliveryStatus,
  };
}

export async function createPurchaseOrder(
  input: PurchaseOrderInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = purchaseOrderSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  const { data: poNumber, error: numberError } = await supabase.rpc("allocate_purchase_order_number", {
    p_org_id: ctx.organizationId,
  });
  if (numberError) return { error: numberError.message };

  const { data, error } = await supabase
    .from("purchase_orders")
    .insert({ organization_id: ctx.organizationId, po_number: poNumber, ...toRow(parsed.data) })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/material-purchase");
  return { error: null, data: { id: data.id } };
}

export async function updatePurchaseOrder(
  orderId: string,
  input: PurchaseOrderInput
): Promise<ActionResult> {
  const parsed = purchaseOrderSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("purchase_orders")
    .update(toRow(parsed.data))
    .eq("id", orderId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/material-purchase");
  return { error: null, data: undefined };
}
