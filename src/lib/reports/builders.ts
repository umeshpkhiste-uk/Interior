import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/calculations/shared";
import { packageRatePerSqft, packagePrice } from "@/lib/calculations/packages";
import { listBoqItems, getBoqSettings } from "@/lib/data/boq";
import { listPackages } from "@/lib/data/packages";
import { listExpenses, listPayments } from "@/lib/data/expenses";
import { EXPENSE_CATEGORY_LABELS, PAYMENT_DIRECTION_LABELS } from "@/lib/validations/expenses";
import { buildQuotationPdfData } from "@/lib/pdf/quotation-pdf-data";
import { getReportHeader } from "./header";
import { computeProjectProfitabilityReport } from "./profitability-shared";
import type { ReportTable } from "./types";

const PACKAGE_TIER_LABELS: Record<string, string> = { basic: "Basic", premium: "Premium", luxury: "Luxury" };

export async function buildProjectCostReport(organizationId: string, projectId: string): Promise<ReportTable> {
  const [header, items, settings] = await Promise.all([
    getReportHeader(organizationId, projectId),
    listBoqItems(organizationId, projectId),
    getBoqSettings(organizationId, projectId),
  ]);

  const byCategory = new Map<string, number>();
  for (const item of items) {
    const key = item.work_category || "Uncategorized";
    byCategory.set(key, (byCategory.get(key) ?? 0) + Number(item.amount));
  }

  const subtotal = items.reduce((s, i) => s + Number(i.amount), 0);
  const contingencyPct = Number(settings?.contingency_pct ?? 0);
  const gstPct = Number(settings?.gst_pct ?? 0);
  const contingencyAmount = subtotal * contingencyPct;
  const gstAmount = (subtotal + contingencyAmount) * gstPct;
  const grandTotal = subtotal + contingencyAmount + gstAmount;

  return {
    title: "Project Cost Report",
    header,
    columns: [
      { key: "category", label: "Work Category" },
      { key: "amount", label: "Amount", align: "right" },
    ],
    rows: Array.from(byCategory.entries()).map(([category, amount]) => ({ category, amount: formatINR(amount) })),
    totals: [
      { label: "Subtotal", value: formatINR(subtotal) },
      { label: `Contingency (${(contingencyPct * 100).toFixed(1)}%)`, value: formatINR(contingencyAmount) },
      { label: `GST (${(gstPct * 100).toFixed(1)}%)`, value: formatINR(gstAmount) },
      { label: "Grand Total", value: formatINR(grandTotal) },
    ],
  };
}

export async function buildRoomWiseCostReport(organizationId: string, projectId: string): Promise<ReportTable> {
  const [header, items] = await Promise.all([getReportHeader(organizationId, projectId), listBoqItems(organizationId, projectId)]);

  const byRoom = new Map<string, number>();
  for (const item of items) {
    const key = item.roomName || "Unassigned";
    byRoom.set(key, (byRoom.get(key) ?? 0) + Number(item.amount));
  }
  const total = items.reduce((s, i) => s + Number(i.amount), 0);

  return {
    title: "Room-wise Cost Report",
    header,
    columns: [
      { key: "room", label: "Room" },
      { key: "amount", label: "Amount", align: "right" },
    ],
    rows: Array.from(byRoom.entries()).map(([room, amount]) => ({ room, amount: formatINR(amount) })),
    totals: [{ label: "Total", value: formatINR(total) }],
  };
}

export async function buildMaterialRequirementReport(organizationId: string, projectId: string): Promise<ReportTable> {
  const [header, items] = await Promise.all([getReportHeader(organizationId, projectId), listBoqItems(organizationId, projectId)]);

  const total = items.reduce((s, i) => s + Number(i.quantity) * Number(i.material_rate), 0);

  return {
    title: "Material Requirement Report",
    header,
    columns: [
      { key: "item", label: "Item" },
      { key: "specification", label: "Specification" },
      { key: "brand", label: "Brand" },
      { key: "quantity", label: "Qty", align: "right" },
      { key: "unit", label: "Unit" },
      { key: "materialRate", label: "Material Rate", align: "right" },
      { key: "materialAmount", label: "Material Amount", align: "right" },
    ],
    rows: items.map((i) => ({
      item: i.item_description,
      specification: i.specification ?? "—",
      brand: i.brand ?? "—",
      quantity: String(Number(i.quantity)),
      unit: i.unit ?? "—",
      materialRate: formatINR(Number(i.material_rate)),
      materialAmount: formatINR(Number(i.quantity) * Number(i.material_rate)),
    })),
    totals: [{ label: "Total Material Cost", value: formatINR(total) }],
  };
}

export async function buildBoqReport(organizationId: string, projectId: string): Promise<ReportTable> {
  const [header, items, settings] = await Promise.all([
    getReportHeader(organizationId, projectId),
    listBoqItems(organizationId, projectId),
    getBoqSettings(organizationId, projectId),
  ]);

  const subtotal = items.reduce((s, i) => s + Number(i.amount), 0);
  const contingencyPct = Number(settings?.contingency_pct ?? 0);
  const gstPct = Number(settings?.gst_pct ?? 0);
  const contingencyAmount = subtotal * contingencyPct;
  const gstAmount = (subtotal + contingencyAmount) * gstPct;
  const grandTotal = subtotal + contingencyAmount + gstAmount;

  return {
    title: "Bill of Quantities (BOQ) Report",
    header,
    columns: [
      { key: "room", label: "Room" },
      { key: "item", label: "Item" },
      { key: "quantity", label: "Qty", align: "right" },
      { key: "unit", label: "Unit" },
      { key: "materialRate", label: "Material Rate", align: "right" },
      { key: "labourRate", label: "Labour Rate", align: "right" },
      { key: "totalRate", label: "Total Rate", align: "right" },
      { key: "amount", label: "Amount", align: "right" },
    ],
    rows: items.map((i) => ({
      room: i.roomName ?? "—",
      item: i.item_description,
      quantity: String(Number(i.quantity)),
      unit: i.unit ?? "—",
      materialRate: formatINR(Number(i.material_rate)),
      labourRate: formatINR(Number(i.labour_rate)),
      totalRate: formatINR(Number(i.total_rate)),
      amount: formatINR(Number(i.amount)),
    })),
    totals: [
      { label: "Subtotal", value: formatINR(subtotal) },
      { label: `Contingency (${(contingencyPct * 100).toFixed(1)}%)`, value: formatINR(contingencyAmount) },
      { label: `GST (${(gstPct * 100).toFixed(1)}%)`, value: formatINR(gstAmount) },
      { label: "Grand Total", value: formatINR(grandTotal) },
    ],
  };
}

export async function buildProfitabilityReport(organizationId: string, projectId: string): Promise<ReportTable> {
  const [header, computation] = await Promise.all([
    getReportHeader(organizationId, projectId),
    computeProjectProfitabilityReport(organizationId, projectId),
  ]);
  const { heads, project } = computation;

  return {
    title: "Profitability Report",
    header,
    columns: [
      { key: "head", label: "Work Head" },
      { key: "material", label: "Material", align: "right" },
      { key: "labour", label: "Labour", align: "right" },
      { key: "overhead", label: "Overhead", align: "right" },
      { key: "cost", label: "Cost", align: "right" },
      { key: "quoted", label: "Quoted", align: "right" },
      { key: "margin", label: "Margin", align: "right" },
      { key: "marginPct", label: "Margin %", align: "right" },
    ],
    rows: heads.map((h) => ({
      head: h.name,
      material: formatINR(h.material),
      labour: formatINR(h.labour),
      overhead: formatINR(h.overhead),
      cost: formatINR(h.cost),
      quoted: formatINR(h.quotedPrice),
      margin: formatINR(h.margin),
      marginPct: `${(h.marginPct * 100).toFixed(1)}%`,
    })),
    totals: [
      { label: "Total Cost", value: formatINR(project.totalCost) },
      { label: "Total Quoted", value: formatINR(project.totalQuoted) },
      { label: "Actual Profit", value: formatINR(project.actualProfit) },
      { label: "Margin %", value: `${(project.actualMarginPct * 100).toFixed(1)}%` },
    ],
  };
}

export async function buildMaterialVsLabourReport(organizationId: string, projectId: string): Promise<ReportTable> {
  const [header, computation] = await Promise.all([
    getReportHeader(organizationId, projectId),
    computeProjectProfitabilityReport(organizationId, projectId),
  ]);
  const { heads, project } = computation;

  return {
    title: "Material vs Labour Report",
    header,
    columns: [
      { key: "head", label: "Work Head" },
      { key: "material", label: "Material", align: "right" },
      { key: "labour", label: "Labour", align: "right" },
      { key: "total", label: "Total", align: "right" },
      { key: "materialSharePct", label: "Material %", align: "right" },
      { key: "labourSharePct", label: "Labour %", align: "right" },
    ],
    rows: heads.map((h) => {
      const total = h.material + h.labour;
      return {
        head: h.name,
        material: formatINR(h.material),
        labour: formatINR(h.labour),
        total: formatINR(total),
        materialSharePct: total > 0 ? `${((h.material / total) * 100).toFixed(1)}%` : "—",
        labourSharePct: total > 0 ? `${((h.labour / total) * 100).toFixed(1)}%` : "—",
      };
    }),
    totals: [
      { label: "Total Material", value: formatINR(project.totalMaterial) },
      { label: "Total Labour", value: formatINR(project.totalLabour) },
    ],
  };
}

export async function buildPackageComparisonReport(organizationId: string, projectId: string, carpetArea: number | null): Promise<ReportTable> {
  const [header, packages] = await Promise.all([getReportHeader(organizationId, projectId), listPackages(organizationId, projectId)]);

  return {
    title: "Package Comparison Report",
    header,
    columns: [
      { key: "tier", label: "Package" },
      { key: "ratePerSqft", label: "Rate / sqft", align: "right" },
      { key: "price", label: "Total Price", align: "right" },
      { key: "selected", label: "Selected" },
    ],
    rows: packages.map((pkg) => {
      const rate = packageRatePerSqft(pkg.components.map((c) => ({ ratePerSqft: Number(c.rate_per_sqft) })));
      const price = carpetArea ? packagePrice(carpetArea, rate, Number(pkg.round_step)) : 0;
      return {
        tier: PACKAGE_TIER_LABELS[pkg.tier] ?? pkg.tier,
        ratePerSqft: formatINR(rate),
        price: carpetArea ? formatINR(price) : "— (set carpet area)",
        selected: pkg.is_selected ? "Yes" : "No",
      };
    }),
  };
}

export async function buildExpenseReport(organizationId: string, projectId: string): Promise<ReportTable> {
  const [header, expenses, payments] = await Promise.all([
    getReportHeader(organizationId, projectId),
    listExpenses(organizationId, projectId),
    listPayments(organizationId, projectId),
  ]);

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalReceived = payments
    .filter((p) => p.direction === "client_advance" || p.direction === "client_payment")
    .reduce((s, p) => s + Number(p.amount), 0);
  const totalPaidToSuppliers = payments.filter((p) => p.direction === "supplier_payment").reduce((s, p) => s + Number(p.amount), 0);

  const rows: Record<string, string>[] = [
    ...expenses.map((e) => ({
      type: "Expense",
      category: EXPENSE_CATEGORY_LABELS[e.category],
      description: e.description ?? "—",
      date: e.expense_date,
      amount: formatINR(Number(e.amount)),
    })),
    ...payments.map((p) => ({
      type: "Payment",
      category: PAYMENT_DIRECTION_LABELS[p.direction],
      description: p.reference_note ?? "—",
      date: p.payment_date,
      amount: formatINR(Number(p.amount)),
    })),
  ];

  return {
    title: "Expense Report",
    header,
    columns: [
      { key: "type", label: "Type" },
      { key: "category", label: "Category" },
      { key: "description", label: "Description" },
      { key: "date", label: "Date" },
      { key: "amount", label: "Amount", align: "right" },
    ],
    rows,
    totals: [
      { label: "Total Expenses", value: formatINR(totalExpenses) },
      { label: "Total Received from Client", value: formatINR(totalReceived) },
      { label: "Total Paid to Suppliers", value: formatINR(totalPaidToSuppliers) },
    ],
  };
}

export async function buildQuotationReport(organizationId: string, quotationId: string): Promise<ReportTable | null> {
  const data = await buildQuotationPdfData(organizationId, quotationId);
  if (!data) return null;

  const header = {
    organizationName: data.organizationName,
    organizationAddress: data.organizationAddress,
    organizationGstin: data.organizationGstin,
    projectName: data.projectName,
    clientName: data.clientName,
    generatedAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
  };

  const rows = [...data.roomLines, ...data.extraLines].map((l) => ({
    description: l.description,
    unit: l.unit ?? "—",
    quantity: String(l.quantity),
    rate: formatINR(l.rate),
    amount: formatINR(l.amount),
  }));

  return {
    title: `Client Quotation Report — ${data.quotationNumber}`,
    header,
    columns: [
      { key: "description", label: "Description" },
      { key: "unit", label: "Unit" },
      { key: "quantity", label: "Qty", align: "right" },
      { key: "rate", label: "Rate", align: "right" },
      { key: "amount", label: "Amount", align: "right" },
    ],
    rows,
    totals: [
      { label: "Subtotal", value: formatINR(data.subtotal) },
      { label: "Contingency", value: formatINR(data.contingencyAmount) },
      { label: "Gross Amount", value: formatINR(data.grossAmount) },
      { label: "Discount", value: formatINR(data.discountAmount) },
      { label: "Taxable Amount", value: formatINR(data.taxableAmount) },
      { label: `GST (${(data.gstPct * 100).toFixed(1)}%)`, value: formatINR(data.gstAmount) },
      { label: "Round Off", value: formatINR(data.roundOff) },
      { label: "Grand Total", value: formatINR(data.grandTotal) },
    ],
  };
}

export async function buildRateRevisionReport(organizationId: string): Promise<ReportTable> {
  const supabase = await createClient();
  const header = await getReportHeader(organizationId);

  const { data, error } = await supabase
    .from("rate_history")
    .select("*, material_rates(materials(name, unit))")
    .eq("organization_id", organizationId)
    .order("changed_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []).map((row) => {
    const material = (row as unknown as { material_rates: { materials: { name: string; unit: string } | null } | null }).material_rates
      ?.materials;
    const oldRate = Number(row.old_rate);
    const newRate = Number(row.new_rate);
    return {
      material: material?.name ?? "—",
      unit: material?.unit ?? "",
      oldRate: formatINR(oldRate),
      newRate: formatINR(newRate),
      change: `${oldRate > 0 ? (((newRate - oldRate) / oldRate) * 100).toFixed(1) : "—"}%`,
      reason: row.reason ?? "—",
      changedAt: new Date(row.changed_at).toLocaleDateString("en-IN"),
    };
  });

  return {
    title: "Rate Revision Report",
    header,
    columns: [
      { key: "material", label: "Material" },
      { key: "unit", label: "Unit" },
      { key: "oldRate", label: "Old Rate", align: "right" },
      { key: "newRate", label: "New Rate", align: "right" },
      { key: "change", label: "Change", align: "right" },
      { key: "reason", label: "Reason" },
      { key: "changedAt", label: "Date" },
    ],
    rows,
  };
}
