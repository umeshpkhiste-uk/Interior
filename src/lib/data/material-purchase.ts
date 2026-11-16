import { createClient } from "@/lib/supabase/server";

export type MaterialPurchaseKpis = {
  purchases: number;
  paid: number;
  balanceToPay: number;
  materialIssued: number;
  awaitingDelivery: number;
  vendors: number;
};

export async function getMaterialPurchaseKpis(organizationId: string): Promise<MaterialPurchaseKpis> {
  const supabase = await createClient();
  const [poRes, paymentsRes, issuesRes, vendorsRes] = await Promise.all([
    supabase.from("purchase_orders").select("amount, delivery_status").eq("organization_id", organizationId),
    supabase.from("vendor_payments").select("amount").eq("organization_id", organizationId),
    supabase.from("material_issues").select("value").eq("organization_id", organizationId),
    supabase.from("suppliers").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
  ]);

  const purchases = (poRes.data ?? []).reduce((acc, row) => acc + (row.amount ?? 0), 0);
  const paid = (paymentsRes.data ?? []).reduce((acc, row) => acc + (row.amount ?? 0), 0);
  const materialIssued = (issuesRes.data ?? []).reduce((acc, row) => acc + (row.value ?? 0), 0);
  const awaitingDelivery = (poRes.data ?? []).filter((row) => row.delivery_status === "pending").length;

  return {
    purchases,
    paid,
    balanceToPay: purchases - paid,
    materialIssued,
    awaitingDelivery,
    vendors: vendorsRes.count ?? 0,
  };
}

export type MaterialPurchaseDashboard = {
  purchasesByCategory: { label: string; purchases: number; toPay: number }[];
  byProject: { label: string; ordered: number; issued: number }[];
  purchasesVsPaymentsByWeek: { label: string; purchases: number; paid: number }[];
  paymentsByMode: { label: string; paid: number }[];
  heatmap: { category: string; byProject: Record<string, number>; total: number }[];
  insights: string[];
};

const TOP_PROJECTS = 6;

export async function getMaterialPurchaseDashboard(organizationId: string): Promise<MaterialPurchaseDashboard> {
  const supabase = await createClient();
  const [poRes, issuesRes, paymentsRes] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select("amount, delivery_status, order_date, suppliers(category), projects(project_code)")
      .eq("organization_id", organizationId),
    supabase.from("material_issues").select("value, projects(project_code)").eq("organization_id", organizationId),
    supabase.from("vendor_payments").select("amount, payment_date, mode").eq("organization_id", organizationId),
  ]);
  if (poRes.error) throw poRes.error;
  if (issuesRes.error) throw issuesRes.error;
  if (paymentsRes.error) throw paymentsRes.error;

  const orders = (poRes.data ?? []) as {
    amount: number;
    delivery_status: string;
    order_date: string;
    suppliers: { category: string | null } | null;
    projects: { project_code: string } | null;
  }[];
  const issues = (issuesRes.data ?? []) as { value: number; projects: { project_code: string } | null }[];
  const payments = (paymentsRes.data ?? []) as { amount: number; payment_date: string; mode: string }[];

  const byCategory = new Map<string, { purchases: number; toPay: number }>();
  const orderedByProject = new Map<string, number>();
  for (const order of orders) {
    const category = order.suppliers?.category ?? "Other";
    const entry = byCategory.get(category) ?? { purchases: 0, toPay: 0 };
    entry.purchases += order.amount;
    if (order.delivery_status === "pending") entry.toPay += order.amount;
    byCategory.set(category, entry);

    const projectCode = order.projects?.project_code ?? "Unassigned";
    orderedByProject.set(projectCode, (orderedByProject.get(projectCode) ?? 0) + order.amount);
  }

  const issuedByProject = new Map<string, number>();
  for (const issue of issues) {
    const projectCode = issue.projects?.project_code ?? "Unassigned";
    issuedByProject.set(projectCode, (issuedByProject.get(projectCode) ?? 0) + issue.value);
  }

  const topProjects = [...orderedByProject.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_PROJECTS)
    .map(([code]) => code);
  const byProject = topProjects.map((code) => ({
    label: code,
    ordered: orderedByProject.get(code) ?? 0,
    issued: issuedByProject.get(code) ?? 0,
  }));

  const weeks = lastNWeeks(6);
  const purchasesByWeek = new Map(weeks.map((w) => [w.key, 0]));
  const paidByWeek = new Map(weeks.map((w) => [w.key, 0]));
  for (const order of orders) {
    const key = weekKeyFor(order.order_date, weeks);
    if (key && purchasesByWeek.has(key)) purchasesByWeek.set(key, (purchasesByWeek.get(key) ?? 0) + order.amount);
  }
  for (const payment of payments) {
    const key = weekKeyFor(payment.payment_date, weeks);
    if (key && paidByWeek.has(key)) paidByWeek.set(key, (paidByWeek.get(key) ?? 0) + payment.amount);
  }

  const byMode = new Map<string, number>();
  for (const payment of payments) {
    byMode.set(payment.mode, (byMode.get(payment.mode) ?? 0) + payment.amount);
  }

  const heatmap = [...byCategory.keys()].map((category) => {
    const byProjectAmount: Record<string, number> = {};
    let total = 0;
    for (const order of orders) {
      const orderCategory = order.suppliers?.category ?? "Other";
      if (orderCategory !== category) continue;
      const projectCode = order.projects?.project_code ?? "Unassigned";
      byProjectAmount[projectCode] = (byProjectAmount[projectCode] ?? 0) + order.amount;
      total += order.amount;
    }
    return { category, byProject: byProjectAmount, total };
  });

  const totalPurchases = orders.reduce((acc, o) => acc + o.amount, 0);
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const biggestCategory = [...byCategory.entries()].sort((a, b) => b[1].purchases - a[1].purchases)[0];
  const biggestProject = [...orderedByProject.entries()].sort((a, b) => b[1] - a[1])[0];
  const pendingLines = orders.filter((o) => o.delivery_status === "pending").length;

  const insights: string[] = [
    `Purchases ${formatPlainINR(totalPurchases)}, paid ${formatPlainINR(totalPaid)}, balance ${formatPlainINR(totalPurchases - totalPaid)}.`,
    biggestCategory ? `Biggest category: ${biggestCategory[0]} (${formatPlainINR(biggestCategory[1].purchases)}).` : "No purchases yet.",
    biggestProject ? `Most material ordered for ${biggestProject[0]} (${formatPlainINR(biggestProject[1])}).` : "No projects ordered for yet.",
    `${pendingLines} order line${pendingLines === 1 ? "" : "s"} still to be delivered: follow up with the vendors.`,
  ];

  return {
    purchasesByCategory: [...byCategory.entries()].map(([label, v]) => ({ label, ...v })),
    byProject,
    purchasesVsPaymentsByWeek: weeks.map((w) => ({
      label: w.label,
      purchases: purchasesByWeek.get(w.key) ?? 0,
      paid: paidByWeek.get(w.key) ?? 0,
    })),
    paymentsByMode: [...byMode.entries()].map(([label, paid]) => ({ label, paid })),
    heatmap,
    insights,
  };
}

function formatPlainINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function lastNWeeks(n: number): { key: string; label: string; start: Date; end: Date }[] {
  const weeks: { key: string; label: string; start: Date; end: Date }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const end = new Date(today);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const key = start.toISOString().slice(0, 10);
    const label = `${start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
    weeks.push({ key, label, start, end });
  }
  return weeks;
}

function weekKeyFor(dateStr: string, weeks: { key: string; start: Date; end: Date }[]): string | null {
  const date = new Date(`${dateStr}T00:00:00`);
  for (const week of weeks) {
    if (date >= week.start && date <= week.end) return week.key;
  }
  return null;
}
