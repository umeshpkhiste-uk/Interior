import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type InvoiceRow = Database["public"]["Tables"]["client_invoices"]["Row"];

export type InvoiceOption = { id: string; invoiceNumber: string; projectId: string; total: number };

export async function listInvoiceOptions(organizationId: string): Promise<InvoiceOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_invoices")
    .select("id, invoice_number, project_id, total")
    .eq("organization_id", organizationId)
    .order("invoice_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, invoiceNumber: row.invoice_number, projectId: row.project_id, total: row.total }));
}

export type InvoiceListItem = InvoiceRow & {
  projectCode: string;
  clientName: string;
  received: number;
  balance: number;
  statusLabel: "Paid" | "Unpaid" | "Partly paid";
};

export async function listInvoices(organizationId: string): Promise<InvoiceListItem[]> {
  const supabase = await createClient();
  const [invoicesRes, paymentsRes] = await Promise.all([
    supabase
      .from("client_invoices")
      .select("*, projects(project_code, clients(name))")
      .eq("organization_id", organizationId)
      .order("invoice_date", { ascending: false }),
    supabase
      .from("project_payments")
      .select("invoice_id, amount")
      .eq("organization_id", organizationId)
      .in("direction", ["client_advance", "client_payment"])
      .not("invoice_id", "is", null),
  ]);
  if (invoicesRes.error) throw invoicesRes.error;
  if (paymentsRes.error) throw paymentsRes.error;

  const receivedByInvoice = new Map<string, number>();
  for (const row of paymentsRes.data ?? []) {
    if (!row.invoice_id) continue;
    receivedByInvoice.set(row.invoice_id, (receivedByInvoice.get(row.invoice_id) ?? 0) + row.amount);
  }

  const rows = invoicesRes.data as (InvoiceRow & { projects: { project_code: string; clients: { name: string } | null } | null })[];
  return rows.map((row) => {
    const { projects, ...rest } = row;
    const received = receivedByInvoice.get(rest.id) ?? 0;
    const balance = rest.total - received;
    return {
      ...rest,
      projectCode: projects?.project_code ?? "—",
      clientName: projects?.clients?.name ?? "—",
      received,
      balance,
      statusLabel: balance <= 0 ? "Paid" : received > 0 ? "Partly paid" : "Unpaid",
    };
  });
}
