import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type ClientReceiptRow = Database["public"]["Tables"]["project_payments"]["Row"];

export type ClientReceiptListItem = ClientReceiptRow & {
  projectCode: string;
  clientName: string;
  invoiceNumber: string | null;
};

/** project_payments rows where money came in from the client (client_advance/client_payment), across all projects. */
export async function listClientReceipts(organizationId: string): Promise<ClientReceiptListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_payments")
    .select("*, projects(project_code, clients(name)), client_invoices(invoice_number)")
    .eq("organization_id", organizationId)
    .in("direction", ["client_advance", "client_payment"])
    .order("payment_date", { ascending: false });
  if (error) throw error;

  const rows = data as (ClientReceiptRow & {
    projects: { project_code: string; clients: { name: string } | null } | null;
    client_invoices: { invoice_number: string } | null;
  })[];

  return rows.map((row) => {
    const { projects, client_invoices, ...rest } = row;
    return {
      ...rest,
      projectCode: projects?.project_code ?? "—",
      clientName: projects?.clients?.name ?? "—",
      invoiceNumber: client_invoices?.invoice_number ?? null,
    };
  });
}
