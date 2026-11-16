import { createClient } from "@/lib/supabase/server";
import { listSuppliers, type SupplierRow } from "@/lib/data/materials";

export type VendorRow = SupplierRow;

export type VendorOption = { id: string; vendorCode: string | null; name: string; category: string | null; creditDays: number };

export async function listVendorOptions(organizationId: string): Promise<VendorOption[]> {
  const suppliers = await listSuppliers(organizationId);
  return suppliers.map((s) => ({
    id: s.id,
    vendorCode: s.vendor_code,
    name: s.name,
    category: s.category,
    creditDays: s.credit_days,
  }));
}

export type VendorListItem = VendorRow & {
  purchases: number;
  paid: number;
  balance: number;
  openPOs: number;
  statusLabel: "To pay" | "Settled";
};

export async function listVendorsWithTotals(organizationId: string): Promise<VendorListItem[]> {
  const supabase = await createClient();
  const [suppliers, poRes, paymentsRes] = await Promise.all([
    listSuppliers(organizationId),
    supabase.from("purchase_orders").select("vendor_id, amount, delivery_status").eq("organization_id", organizationId),
    supabase.from("vendor_payments").select("vendor_id, amount").eq("organization_id", organizationId),
  ]);

  const purchasesByVendor = new Map<string, number>();
  const openPOsByVendor = new Map<string, number>();
  for (const po of poRes.data ?? []) {
    purchasesByVendor.set(po.vendor_id, (purchasesByVendor.get(po.vendor_id) ?? 0) + po.amount);
    if (po.delivery_status === "pending") {
      openPOsByVendor.set(po.vendor_id, (openPOsByVendor.get(po.vendor_id) ?? 0) + 1);
    }
  }
  const paidByVendor = new Map<string, number>();
  for (const payment of paymentsRes.data ?? []) {
    paidByVendor.set(payment.vendor_id, (paidByVendor.get(payment.vendor_id) ?? 0) + payment.amount);
  }

  return suppliers.map((vendor) => {
    const purchases = purchasesByVendor.get(vendor.id) ?? 0;
    const paid = paidByVendor.get(vendor.id) ?? 0;
    const balance = purchases - paid;
    return {
      ...vendor,
      purchases,
      paid,
      balance,
      openPOs: openPOsByVendor.get(vendor.id) ?? 0,
      statusLabel: balance > 0 ? "To pay" : "Settled",
    };
  });
}
