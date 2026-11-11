import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type ExpenseRow = Database["public"]["Tables"]["project_expenses"]["Row"];
export type PaymentRow = Database["public"]["Tables"]["project_payments"]["Row"];

export async function listExpenses(organizationId: string, projectId: string): Promise<ExpenseRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_expenses")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("expense_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listPayments(organizationId: string, projectId: string): Promise<PaymentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_payments")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("payment_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
