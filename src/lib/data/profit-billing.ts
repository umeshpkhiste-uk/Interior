import { createClient } from "@/lib/supabase/server";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expenses";

async function getContractValueByProject(organizationId: string): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotations")
    .select("project_id, taxable_amount, created_at")
    .eq("organization_id", organizationId)
    .in("status", ["sent", "viewed", "approved"])
    .order("created_at", { ascending: false });
  if (error) throw error;

  const seen = new Set<string>();
  const result = new Map<string, number>();
  for (const row of data ?? []) {
    if (seen.has(row.project_id)) continue;
    seen.add(row.project_id);
    result.set(row.project_id, row.taxable_amount);
  }
  return result;
}

export type ProjectBillingListItem = {
  id: string;
  projectCode: string;
  name: string;
  clientName: string;
  contractValue: number;
  billed: number;
  outstanding: number;
  costs: number;
  profit: number;
  margin: number | null;
  statusLabel: "Not billed yet" | "Paid, bill more" | "Fully paid" | "Outstanding";
};

export async function listProjectsBilling(organizationId: string): Promise<ProjectBillingListItem[]> {
  const supabase = await createClient();
  const [projectsRes, invoicesRes, paymentsRes, expensesRes, contractValueByProject] = await Promise.all([
    supabase.from("projects").select("id, project_code, name, clients(name)").eq("organization_id", organizationId).is("archived_at", null),
    supabase.from("client_invoices").select("project_id, amount, total").eq("organization_id", organizationId),
    supabase
      .from("project_payments")
      .select("project_id, amount")
      .eq("organization_id", organizationId)
      .in("direction", ["client_advance", "client_payment"]),
    supabase.from("project_expenses").select("project_id, amount").eq("organization_id", organizationId),
    getContractValueByProject(organizationId),
  ]);
  if (projectsRes.error) throw projectsRes.error;
  if (invoicesRes.error) throw invoicesRes.error;
  if (paymentsRes.error) throw paymentsRes.error;
  if (expensesRes.error) throw expensesRes.error;

  const billedByProject = new Map<string, number>();
  const billedWithGstByProject = new Map<string, number>();
  for (const row of invoicesRes.data ?? []) {
    billedByProject.set(row.project_id, (billedByProject.get(row.project_id) ?? 0) + row.amount);
    billedWithGstByProject.set(row.project_id, (billedWithGstByProject.get(row.project_id) ?? 0) + row.total);
  }
  const receivedByProject = new Map<string, number>();
  for (const row of paymentsRes.data ?? []) {
    receivedByProject.set(row.project_id, (receivedByProject.get(row.project_id) ?? 0) + row.amount);
  }
  const costsByProject = new Map<string, number>();
  for (const row of expensesRes.data ?? []) {
    costsByProject.set(row.project_id, (costsByProject.get(row.project_id) ?? 0) + row.amount);
  }

  const projects = projectsRes.data as { id: string; project_code: string; name: string; clients: { name: string } | null }[];
  return projects.map((project) => {
    const contractValue = contractValueByProject.get(project.id) ?? 0;
    const billed = billedByProject.get(project.id) ?? 0;
    const billedWithGst = billedWithGstByProject.get(project.id) ?? 0;
    const received = receivedByProject.get(project.id) ?? 0;
    const outstanding = billedWithGst - received;
    const costs = costsByProject.get(project.id) ?? 0;
    const profit = billed - costs;
    const margin = billed > 0 ? profit / billed : null;

    let statusLabel: ProjectBillingListItem["statusLabel"] = "Not billed yet";
    if (billed > 0) {
      if (outstanding > 0) statusLabel = "Outstanding";
      else if (billed < contractValue) statusLabel = "Paid, bill more";
      else statusLabel = "Fully paid";
    }

    return {
      id: project.id,
      projectCode: project.project_code,
      name: project.name,
      clientName: project.clients?.name ?? "—",
      contractValue,
      billed,
      outstanding,
      costs,
      profit,
      margin,
      statusLabel,
    };
  });
}

export type ProfitBillingKpis = {
  contractValue: number;
  billed: number;
  received: number;
  outstanding: number;
  costs: number;
  profitSoFar: number;
};

export async function getProfitBillingKpis(organizationId: string): Promise<ProfitBillingKpis> {
  const supabase = await createClient();
  const [projects, paymentsRes] = await Promise.all([
    listProjectsBilling(organizationId),
    supabase
      .from("project_payments")
      .select("amount")
      .eq("organization_id", organizationId)
      .in("direction", ["client_advance", "client_payment"]),
  ]);
  if (paymentsRes.error) throw paymentsRes.error;

  const received = (paymentsRes.data ?? []).reduce((acc, row) => acc + row.amount, 0);

  return projects.reduce(
    (acc, p) => ({
      contractValue: acc.contractValue + p.contractValue,
      billed: acc.billed + p.billed,
      received,
      outstanding: acc.outstanding + p.outstanding,
      costs: acc.costs + p.costs,
      profitSoFar: acc.profitSoFar + p.profit,
    }),
    { contractValue: 0, billed: 0, received, outstanding: 0, costs: 0, profitSoFar: 0 }
  );
}

export type ProfitBillingDashboard = {
  billedVsCostsByMonth: { label: string; billed: number; received: number; costs: number; profit: number }[];
  profitByProject: { label: string; billed: number; profit: number }[];
  costsByHead: { label: string; amount: number }[];
  insights: string[];
};

const TOP_PROJECTS = 8;

export async function getProfitBillingDashboard(organizationId: string): Promise<ProfitBillingDashboard> {
  const supabase = await createClient();
  const [invoicesRes, paymentsRes, expensesRes, projectsBilling] = await Promise.all([
    supabase.from("client_invoices").select("amount, invoice_date").eq("organization_id", organizationId),
    supabase
      .from("project_payments")
      .select("amount, payment_date")
      .eq("organization_id", organizationId)
      .in("direction", ["client_advance", "client_payment"]),
    supabase.from("project_expenses").select("amount, expense_date, category").eq("organization_id", organizationId),
    listProjectsBilling(organizationId),
  ]);
  if (invoicesRes.error) throw invoicesRes.error;
  if (paymentsRes.error) throw paymentsRes.error;
  if (expensesRes.error) throw expensesRes.error;

  const months = lastNMonths(6);
  const billedByMonth = new Map(months.map((m) => [m.key, 0]));
  const receivedByMonth = new Map(months.map((m) => [m.key, 0]));
  const costsByMonth = new Map(months.map((m) => [m.key, 0]));
  for (const row of invoicesRes.data ?? []) {
    const key = monthKeyFor(row.invoice_date, months);
    if (key) billedByMonth.set(key, (billedByMonth.get(key) ?? 0) + row.amount);
  }
  for (const row of paymentsRes.data ?? []) {
    const key = monthKeyFor(row.payment_date, months);
    if (key) receivedByMonth.set(key, (receivedByMonth.get(key) ?? 0) + row.amount);
  }
  const costsByHeadMap = new Map<string, number>();
  for (const row of expensesRes.data ?? []) {
    const key = monthKeyFor(row.expense_date, months);
    if (key) costsByMonth.set(key, (costsByMonth.get(key) ?? 0) + row.amount);
    const label = EXPENSE_CATEGORY_LABELS[row.category];
    costsByHeadMap.set(label, (costsByHeadMap.get(label) ?? 0) + row.amount);
  }

  const billedVsCostsByMonth = months.map((m) => ({
    label: m.label,
    billed: billedByMonth.get(m.key) ?? 0,
    received: receivedByMonth.get(m.key) ?? 0,
    costs: costsByMonth.get(m.key) ?? 0,
    profit: (billedByMonth.get(m.key) ?? 0) - (costsByMonth.get(m.key) ?? 0),
  }));

  const profitByProject = [...projectsBilling]
    .sort((a, b) => b.contractValue - a.contractValue)
    .slice(0, TOP_PROJECTS)
    .map((p) => ({ label: p.projectCode, billed: p.billed, profit: p.profit }));

  const costsByHead = [...costsByHeadMap.entries()].sort((a, b) => b[1] - a[1]).map(([label, amount]) => ({ label, amount }));

  const totalContractValue = projectsBilling.reduce((acc, p) => acc + p.contractValue, 0);
  const totalBilled = projectsBilling.reduce((acc, p) => acc + p.billed, 0);
  const totalProfit = projectsBilling.reduce((acc, p) => acc + p.profit, 0);
  const totalOutstanding = projectsBilling.reduce((acc, p) => acc + p.outstanding, 0);
  const margin = totalBilled > 0 ? (totalProfit / totalBilled) * 100 : 0;
  const biggestHead = costsByHead[0];
  const belowTarget = projectsBilling.filter((p) => p.margin !== null && p.margin < 0.25);

  const insights: string[] = [
    `Billed ${formatPlainINR(totalBilled)} of ${formatPlainINR(totalContractValue)}; profit so far ${formatPlainINR(totalProfit)} (${margin.toFixed(1)}%).`,
    `Outstanding from clients: ${formatPlainINR(totalOutstanding)}; still to bill ${formatPlainINR(Math.max(0, totalContractValue - totalBilled))}.`,
    biggestHead ? `Biggest cost head: ${biggestHead.label} (${formatPlainINR(biggestHead.amount)}).` : "No costs logged yet.",
    belowTarget.length > 0
      ? `${belowTarget.length} project${belowTarget.length === 1 ? "" : "s"} below the 25% target margin on what is billed.`
      : "No project is below the 25% target margin on what is billed.",
  ];

  return { billedVsCostsByMonth, profitByProject, costsByHead, insights };
}

function formatPlainINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function lastNMonths(n: number): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    months.push({ key, label });
  }
  return months;
}

function monthKeyFor(dateStr: string, months: { key: string }[]): string | null {
  const key = dateStr.slice(0, 7);
  return months.some((m) => m.key === key) ? key : null;
}
