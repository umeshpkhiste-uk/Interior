"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { invoiceSchema, type InvoiceInput } from "@/lib/validations/invoice";
import type { ActionResult } from "@/lib/actions/clients";

function toRow(input: InvoiceInput) {
  return {
    project_id: input.projectId,
    invoice_date: input.invoiceDate,
    milestone: input.milestone,
    amount: input.amount,
    gst_pct: input.gstPct / 100,
    due_date: input.dueDate || null,
  };
}

export async function createInvoice(input: InvoiceInput): Promise<ActionResult<{ id: string }>> {
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  const { data: invoiceNumber, error: numberError } = await supabase.rpc("allocate_invoice_number", {
    p_org_id: ctx.organizationId,
  });
  if (numberError) return { error: numberError.message };

  const { data, error } = await supabase
    .from("client_invoices")
    .insert({ organization_id: ctx.organizationId, invoice_number: invoiceNumber, ...toRow(parsed.data) })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/profit-billing");
  return { error: null, data: { id: data.id } };
}

export async function updateInvoice(invoiceId: string, input: InvoiceInput): Promise<ActionResult> {
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("client_invoices")
    .update(toRow(parsed.data))
    .eq("id", invoiceId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath("/profit-billing");
  return { error: null, data: undefined };
}
