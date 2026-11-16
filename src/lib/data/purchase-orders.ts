import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type PurchaseOrderRow = Database["public"]["Tables"]["purchase_orders"]["Row"];

export type PurchaseOrderListItem = PurchaseOrderRow & {
  vendorCode: string | null;
  vendorName: string;
  projectCode: string | null;
  payBy: string;
};

export async function listPurchaseOrders(organizationId: string): Promise<PurchaseOrderListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("*, suppliers(vendor_code, name, credit_days), projects(project_code)")
    .eq("organization_id", organizationId)
    .order("order_date", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const { suppliers, projects, ...rest } = row as typeof row & {
      suppliers: { vendor_code: string | null; name: string; credit_days: number } | null;
      projects: { project_code: string } | null;
    };
    return {
      ...rest,
      vendorCode: suppliers?.vendor_code ?? null,
      vendorName: suppliers?.name ?? "—",
      projectCode: projects?.project_code ?? null,
      payBy: addDays(rest.order_date, suppliers?.credit_days ?? 0),
    };
  });
}

export type PurchaseOrderOption = { id: string; poNumber: string; item: string; projectId: string | null };

export async function listPurchaseOrderOptions(organizationId: string): Promise<PurchaseOrderOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("id, po_number, item, project_id")
    .eq("organization_id", organizationId)
    .order("order_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    poNumber: row.po_number,
    item: row.item,
    projectId: row.project_id,
  }));
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
