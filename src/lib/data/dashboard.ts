import { createClient } from "@/lib/supabase/server";

const REVENUE_STATUSES = ["sent", "viewed", "approved"] as const;
const MONTHS_BACK = 6;

export type DashboardSummary = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalClients: number;
  totalEstimatedValue: number;
  totalQuotedAmount: number;
  totalActualExpenses: number;
  expectedProfit: number;
  avgCostPerSqFt: number | null;
};

export async function getDashboardSummary(organizationId: string): Promise<DashboardSummary> {
  const supabase = await createClient();

  const [
    projectsRes,
    clientsRes,
    boqRes,
    quotationsRes,
    expensesRes,
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("status, carpet_area", { count: "exact" })
      .eq("organization_id", organizationId)
      .is("archived_at", null),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("archived_at", null),
    supabase.from("boq_items").select("amount").eq("organization_id", organizationId),
    supabase
      .from("quotations")
      .select("grand_total, status")
      .eq("organization_id", organizationId)
      .in("status", REVENUE_STATUSES),
    supabase.from("project_expenses").select("amount").eq("organization_id", organizationId),
  ]);

  const projects = projectsRes.data ?? [];
  const totalProjects = projectsRes.count ?? projects.length;
  const activeProjects = projects.filter(
    (p) => p.status !== "completed" && p.status !== "cancelled"
  ).length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const totalClients = clientsRes.count ?? 0;

  const totalEstimatedValue = sum(boqRes.data, "amount");
  const totalQuotedAmount = sum(quotationsRes.data, "grand_total");
  const totalActualExpenses = sum(expensesRes.data, "amount");
  const expectedProfit = totalQuotedAmount - totalActualExpenses;

  const totalCarpetArea = projects.reduce((acc, p) => acc + (p.carpet_area ?? 0), 0);
  const avgCostPerSqFt = totalCarpetArea > 0 ? totalEstimatedValue / totalCarpetArea : null;

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalClients,
    totalEstimatedValue,
    totalQuotedAmount,
    totalActualExpenses,
    expectedProfit,
    avgCostPerSqFt,
  };
}

export type ProjectCostPoint = { projectName: string; estimatedCost: number };

export async function getProjectCostChart(organizationId: string): Promise<ProjectCostPoint[]> {
  const supabase = await createClient();
  const { data: boqItems } = await supabase
    .from("boq_items")
    .select("project_id, amount")
    .eq("organization_id", organizationId);

  if (!boqItems || boqItems.length === 0) return [];

  const totalsByProject = new Map<string, number>();
  for (const item of boqItems) {
    totalsByProject.set(item.project_id, (totalsByProject.get(item.project_id) ?? 0) + item.amount);
  }

  const projectIds = [...totalsByProject.keys()];
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .in("id", projectIds);

  const nameById = new Map((projects ?? []).map((p) => [p.id, p.name]));

  return [...totalsByProject.entries()]
    .map(([projectId, estimatedCost]) => ({
      projectName: nameById.get(projectId) ?? "Untitled project",
      estimatedCost,
    }))
    .sort((a, b) => b.estimatedCost - a.estimatedCost)
    .slice(0, 10);
}

export type MonthlyFinancials = { month: string; revenue: number; expenses: number; profit: number };

export async function getMonthlyFinancials(organizationId: string): Promise<MonthlyFinancials[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setMonth(since.getMonth() - (MONTHS_BACK - 1));
  since.setDate(1);
  const sinceIso = since.toISOString().slice(0, 10);

  const [quotationsRes, expensesRes] = await Promise.all([
    supabase
      .from("quotations")
      .select("grand_total, quotation_date, status")
      .eq("organization_id", organizationId)
      .in("status", REVENUE_STATUSES)
      .gte("quotation_date", sinceIso),
    supabase
      .from("project_expenses")
      .select("amount, expense_date")
      .eq("organization_id", organizationId)
      .gte("expense_date", sinceIso),
  ]);

  const months = lastNMonthKeys(MONTHS_BACK);
  const revenueByMonth = new Map(months.map((m) => [m, 0]));
  const expensesByMonth = new Map(months.map((m) => [m, 0]));

  for (const q of quotationsRes.data ?? []) {
    const key = monthKey(q.quotation_date);
    if (revenueByMonth.has(key)) {
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + q.grand_total);
    }
  }
  for (const e of expensesRes.data ?? []) {
    const key = monthKey(e.expense_date);
    if (expensesByMonth.has(key)) {
      expensesByMonth.set(key, (expensesByMonth.get(key) ?? 0) + e.amount);
    }
  }

  return months.map((key) => {
    const revenue = revenueByMonth.get(key) ?? 0;
    const expenses = expensesByMonth.get(key) ?? 0;
    return { month: formatMonthLabel(key), revenue, expenses, profit: revenue - expenses };
  });
}

export type MaterialVsLabour = { materialCost: number; labourCost: number };

export async function getMaterialVsLabour(organizationId: string): Promise<MaterialVsLabour> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("boq_items")
    .select("quantity, material_rate, labour_rate")
    .eq("organization_id", organizationId);

  if (!data) return { materialCost: 0, labourCost: 0 };

  return data.reduce(
    (acc, row) => ({
      materialCost: acc.materialCost + row.quantity * row.material_rate,
      labourCost: acc.labourCost + row.quantity * row.labour_rate,
    }),
    { materialCost: 0, labourCost: 0 }
  );
}

export type PackageComparisonPoint = { tier: "basic" | "premium" | "luxury"; avgRatePerSqFt: number };

export async function getPackageComparison(
  organizationId: string
): Promise<PackageComparisonPoint[]> {
  const supabase = await createClient();
  const { data: packages } = await supabase
    .from("project_packages")
    .select("id, tier, package_components(rate_per_sqft)")
    .eq("organization_id", organizationId);

  if (!packages || packages.length === 0) return [];

  const totalsByTier = new Map<string, { sum: number; count: number }>();
  for (const pkg of packages) {
    const components = (pkg.package_components ?? []) as { rate_per_sqft: number }[];
    const packageTotal = components.reduce((acc, c) => acc + c.rate_per_sqft, 0);
    const entry = totalsByTier.get(pkg.tier) ?? { sum: 0, count: 0 };
    entry.sum += packageTotal;
    entry.count += 1;
    totalsByTier.set(pkg.tier, entry);
  }

  return (["basic", "premium", "luxury"] as const)
    .filter((tier) => totalsByTier.has(tier))
    .map((tier) => {
      const entry = totalsByTier.get(tier)!;
      return { tier, avgRatePerSqFt: entry.sum / entry.count };
    });
}

export type RecentProject = {
  id: string;
  name: string;
  clientName: string;
  location: string | null;
  carpetArea: number | null;
  estimatedBudget: number;
  quotedAmount: number;
  status: string;
  updatedAt: string;
};

export async function getRecentProjects(organizationId: string): Promise<RecentProject[]> {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, property_address, carpet_area, status, updated_at, clients(name)")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(8);

  if (!projects || projects.length === 0) return [];

  const projectIds = projects.map((p) => p.id);
  const [boqRes, quotationsRes] = await Promise.all([
    supabase.from("boq_items").select("project_id, amount").in("project_id", projectIds),
    supabase
      .from("quotations")
      .select("project_id, grand_total, status")
      .in("project_id", projectIds)
      .in("status", REVENUE_STATUSES),
  ]);

  const estimatedByProject = new Map<string, number>();
  for (const item of boqRes.data ?? []) {
    estimatedByProject.set(item.project_id, (estimatedByProject.get(item.project_id) ?? 0) + item.amount);
  }
  const quotedByProject = new Map<string, number>();
  for (const q of quotationsRes.data ?? []) {
    quotedByProject.set(q.project_id, (quotedByProject.get(q.project_id) ?? 0) + q.grand_total);
  }

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    clientName: (p.clients as { name: string } | null)?.name ?? "—",
    location: p.property_address,
    carpetArea: p.carpet_area,
    estimatedBudget: estimatedByProject.get(p.id) ?? 0,
    quotedAmount: quotedByProject.get(p.id) ?? 0,
    status: p.status,
    updatedAt: p.updated_at,
  }));
}

function sum<T extends Record<string, unknown>>(rows: T[] | null, key: keyof T): number {
  if (!rows) return 0;
  return rows.reduce((acc, row) => acc + ((row[key] as number) ?? 0), 0);
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function lastNMonthKeys(n: number): string[] {
  const keys: string[] = [];
  const cursor = new Date();
  cursor.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() - i);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
}
