import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type MaterialIssueRow = Database["public"]["Tables"]["material_issues"]["Row"];

export type MaterialIssueListItem = MaterialIssueRow & {
  projectCode: string;
  poNumber: string | null;
  leftOnPO: number | null;
};

export async function listMaterialIssues(organizationId: string): Promise<MaterialIssueListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("material_issues")
    .select("*, projects(project_code), purchase_orders(po_number, qty)")
    .eq("organization_id", organizationId)
    .order("issue_date", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as (MaterialIssueRow & {
    projects: { project_code: string } | null;
    purchase_orders: { po_number: string; qty: number } | null;
  })[];

  const issuedByPO = new Map<string, number>();
  for (const row of rows) {
    if (row.purchase_order_id) {
      issuedByPO.set(row.purchase_order_id, (issuedByPO.get(row.purchase_order_id) ?? 0) + row.qty);
    }
  }

  return rows.map((row) => {
    const { projects, purchase_orders, ...rest } = row;
    const leftOnPO =
      rest.purchase_order_id && purchase_orders
        ? purchase_orders.qty - (issuedByPO.get(rest.purchase_order_id) ?? 0)
        : null;
    return {
      ...rest,
      projectCode: projects?.project_code ?? "—",
      poNumber: purchase_orders?.po_number ?? null,
      leftOnPO,
    };
  });
}
