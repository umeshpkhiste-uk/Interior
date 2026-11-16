import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type VendorPaymentRow = Database["public"]["Tables"]["vendor_payments"]["Row"];

export type VendorPaymentListItem = VendorPaymentRow & {
  vendorCode: string | null;
  vendorName: string;
  balanceAfter: number;
};

export async function listVendorPayments(organizationId: string): Promise<VendorPaymentListItem[]> {
  const supabase = await createClient();
  const [paymentsRes, ordersRes] = await Promise.all([
    supabase
      .from("vendor_payments")
      .select("*, suppliers(vendor_code, name)")
      .eq("organization_id", organizationId)
      .order("payment_date", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("purchase_orders").select("vendor_id, order_date, amount").eq("organization_id", organizationId),
  ]);
  if (paymentsRes.error) throw paymentsRes.error;
  if (ordersRes.error) throw ordersRes.error;

  const ordersByVendor = new Map<string, { date: string; amount: number }[]>();
  for (const order of ordersRes.data ?? []) {
    const list = ordersByVendor.get(order.vendor_id) ?? [];
    list.push({ date: order.order_date, amount: order.amount });
    ordersByVendor.set(order.vendor_id, list);
  }

  const paidSoFar = new Map<string, number>();
  const items = (paymentsRes.data ?? []).map((row) => {
    const { suppliers, ...rest } = row as typeof row & {
      suppliers: { vendor_code: string | null; name: string } | null;
    };
    const paidBefore = paidSoFar.get(rest.vendor_id) ?? 0;
    const paidUpToNow = paidBefore + rest.amount;
    paidSoFar.set(rest.vendor_id, paidUpToNow);

    const orderedUpToDate = (ordersByVendor.get(rest.vendor_id) ?? [])
      .filter((o) => o.date <= rest.payment_date)
      .reduce((acc, o) => acc + o.amount, 0);

    return {
      ...rest,
      vendorCode: suppliers?.vendor_code ?? null,
      vendorName: suppliers?.name ?? "—",
      balanceAfter: orderedUpToDate - paidUpToNow,
    };
  });

  return items.sort((a, b) => b.payment_date.localeCompare(a.payment_date));
}
