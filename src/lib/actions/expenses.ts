"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { expenseSchema, paymentSchema, type ExpenseInput, type PaymentInput } from "@/lib/validations/expenses";
import type { ActionResult } from "@/lib/actions/clients";

export async function addExpense(projectId: string, input: ExpenseInput): Promise<ActionResult> {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("project_expenses").insert({
    organization_id: ctx.organizationId,
    project_id: projectId,
    category: parsed.data.category,
    description: parsed.data.description || null,
    amount: parsed.data.amount,
    expense_date: parsed.data.expenseDate || new Date().toISOString().slice(0, 10),
    recorded_by: ctx.userId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function deleteExpense(expenseId: string, projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("project_expenses").delete().eq("id", expenseId).eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function addPayment(projectId: string, input: PaymentInput): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("project_payments").insert({
    organization_id: ctx.organizationId,
    project_id: projectId,
    direction: parsed.data.direction,
    amount: parsed.data.amount,
    payment_date: parsed.data.paymentDate || new Date().toISOString().slice(0, 10),
    method: parsed.data.method || null,
    reference_note: parsed.data.referenceNote || null,
    recorded_by: ctx.userId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function deletePayment(paymentId: string, projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("project_payments").delete().eq("id", paymentId).eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}
