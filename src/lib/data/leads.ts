import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { LEAD_SOURCES, LEAD_SOURCE_LABELS, LEAD_STAGES, LEAD_STAGE_LABELS } from "@/lib/validations/lead";
import { LEAD_QUOTATION_STATUSES, LEAD_QUOTATION_STATUS_LABELS } from "@/lib/validations/lead-quotation";
import { countFollowupsByLead } from "@/lib/data/lead-followups";
import { daysBetween, getLatestQuotationPerLead } from "@/lib/data/lead-quotations";

export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type LeadStage = Database["public"]["Enums"]["lead_stage"];

export type LeadListItem = LeadRow & {
  daysOld: number;
  followupCount: number;
  lastQuoteAmount: number | null;
  statusLabel: string;
};

export async function listLeads(
  organizationId: string,
  opts: { search?: string; stage?: LeadStage | "all" } = {}
): Promise<LeadListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("leads")
    .select("*")
    .eq("organization_id", organizationId)
    .order("enquiry_date", { ascending: false });

  if (opts.stage && opts.stage !== "all") {
    query = query.eq("stage", opts.stage);
  }
  if (opts.search && opts.search.trim().length > 0) {
    query = query.ilike("client_name", `%${opts.search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  const leads = data ?? [];
  if (leads.length === 0) return [];

  const [followupCounts, latestQuotes] = await Promise.all([
    countFollowupsByLead(organizationId),
    getLatestQuotationPerLead(organizationId),
  ]);

  const today = new Date();
  return leads.map((lead) => ({
    ...lead,
    daysOld: daysBetween(lead.enquiry_date, today),
    followupCount: followupCounts.get(lead.id) ?? 0,
    lastQuoteAmount: latestQuotes.get(lead.id)?.final_amount ?? null,
    statusLabel: statusLabelFor(lead, today),
  }));
}

export type LeadOption = { id: string; leadCode: string; clientName: string; phone: string | null };

export async function listLeadOptions(organizationId: string): Promise<LeadOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, lead_code, client_name, phone")
    .eq("organization_id", organizationId)
    .order("enquiry_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    leadCode: row.lead_code,
    clientName: row.client_name,
    phone: row.phone,
  }));
}

export type LeadKpis = {
  totalLeads: number;
  openLeads: number;
  openQuotesValue: number;
  wonValue: number;
  conversionRate: number | null;
  callToday: number;
};

export async function getLeadKpis(organizationId: string): Promise<LeadKpis> {
  const supabase = await createClient();
  const [{ data, error }, latestQuotes] = await Promise.all([
    supabase.from("leads").select("id, stage, next_followup_date").eq("organization_id", organizationId),
    getLatestQuotationPerLead(organizationId),
  ]);
  if (error) throw error;

  const rows = data ?? [];
  const todayIso = new Date().toISOString().slice(0, 10);
  const won = rows.filter((r) => r.stage === "won").length;
  const lost = rows.filter((r) => r.stage === "lost").length;
  const callToday = rows.filter(
    (r) => r.stage !== "won" && r.stage !== "lost" && r.next_followup_date !== null && r.next_followup_date <= todayIso
  ).length;

  let openQuotesValue = 0;
  let wonValue = 0;
  for (const quote of latestQuotes.values()) {
    if (quote.status === "sent" || quote.status === "revised") {
      openQuotesValue += quote.final_amount ?? 0;
    } else if (quote.status === "accepted") {
      wonValue += quote.final_amount ?? 0;
    }
  }

  return {
    totalLeads: rows.length,
    openLeads: rows.filter((r) => r.stage !== "won" && r.stage !== "lost").length,
    openQuotesValue,
    wonValue,
    conversionRate: won + lost > 0 ? won / (won + lost) : null,
    callToday,
  };
}

export type LeadDashboard = {
  leadsBySource: { source: string; label: string; leads: number; won: number; wonValue: number }[];
  leadsByStage: { stage: string; label: string; leads: number; budget: number }[];
  quotationsByStatus: { status: string; label: string; quotes: number; value: number }[];
  weeklyTrend: { label: string; newLeads: number; followups: number }[];
  pipeline: { source: string; label: string; byStage: Record<string, number>; total: number }[];
  insights: string[];
};

export async function getLeadDashboard(organizationId: string): Promise<LeadDashboard> {
  const supabase = await createClient();
  const [{ data: leadsData, error: leadsError }, { data: followupsData, error: followupsError }, latestQuotes] =
    await Promise.all([
      supabase
        .from("leads")
        .select("id, source, stage, budget, enquiry_date")
        .eq("organization_id", organizationId),
      supabase.from("lead_followups").select("followup_date").eq("organization_id", organizationId),
      getLatestQuotationPerLead(organizationId),
    ]);
  if (leadsError) throw leadsError;
  if (followupsError) throw followupsError;

  const leads = leadsData ?? [];
  const followups = followupsData ?? [];

  const bySource = new Map<string, { leads: number; won: number; wonValue: number }>();
  const byStage = new Map<string, { leads: number; budget: number }>();
  const pipelineBySource = new Map<string, Record<string, number>>();

  for (const lead of leads) {
    const sourceEntry = bySource.get(lead.source) ?? { leads: 0, won: 0, wonValue: 0 };
    sourceEntry.leads += 1;
    bySource.set(lead.source, sourceEntry);

    const stageEntry = byStage.get(lead.stage) ?? { leads: 0, budget: 0 };
    stageEntry.leads += 1;
    stageEntry.budget += lead.budget ?? 0;
    byStage.set(lead.stage, stageEntry);

    const pipelineEntry = pipelineBySource.get(lead.source) ?? {};
    pipelineEntry[lead.stage] = (pipelineEntry[lead.stage] ?? 0) + 1;
    pipelineBySource.set(lead.source, pipelineEntry);
  }

  const leadSourceById = new Map(leads.map((l) => [l.id, l.source]));
  const byQuoteStatus = new Map<string, { quotes: number; value: number }>();
  for (const quote of latestQuotes.values()) {
    const entry = byQuoteStatus.get(quote.status) ?? { quotes: 0, value: 0 };
    entry.quotes += 1;
    entry.value += quote.final_amount ?? 0;
    byQuoteStatus.set(quote.status, entry);

    if (quote.status === "accepted") {
      const sourceEntry = bySource.get(leadSourceById.get(quote.lead_id) ?? "");
      if (sourceEntry) {
        sourceEntry.won += 1;
        sourceEntry.wonValue += quote.final_amount ?? 0;
      }
    }
  }

  const weeks = lastNWeeks(6);
  const newLeadsByWeek = new Map(weeks.map((w) => [w.key, 0]));
  const followupsByWeek = new Map(weeks.map((w) => [w.key, 0]));
  for (const lead of leads) {
    const key = weekKeyFor(lead.enquiry_date, weeks);
    if (key && newLeadsByWeek.has(key)) newLeadsByWeek.set(key, (newLeadsByWeek.get(key) ?? 0) + 1);
  }
  for (const followup of followups) {
    const key = weekKeyFor(followup.followup_date, weeks);
    if (key && followupsByWeek.has(key)) followupsByWeek.set(key, (followupsByWeek.get(key) ?? 0) + 1);
  }

  const totalLeads = leads.length;
  const won = leads.filter((l) => l.stage === "won").length;
  const lost = leads.filter((l) => l.stage === "lost").length;
  const totalWonValue = [...bySource.values()].reduce((acc, s) => acc + s.wonValue, 0);
  const bestSource = [...bySource.entries()].sort((a, b) => b[1].leads - a[1].leads)[0];
  const openQuotesValue = [...byQuoteStatus.entries()]
    .filter(([status]) => status === "sent" || status === "revised")
    .reduce((acc, [, v]) => acc + v.value, 0);
  const insights: string[] = [
    `${totalLeads} leads, ${won} won (${won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0}% of closed leads), worth ${formatPlainINR(totalWonValue)}.`,
    bestSource ? `Best source: ${LEAD_SOURCE_LABELS[bestSource[0] as keyof typeof LEAD_SOURCE_LABELS] ?? bestSource[0]} with ${bestSource[1].leads} leads.` : "No leads yet.",
    `Quotations waiting for a reply (latest version of each lead): ${formatPlainINR(openQuotesValue)}.`,
  ];

  return {
    leadsBySource: LEAD_SOURCES.map((source) => ({
      source,
      label: LEAD_SOURCE_LABELS[source],
      leads: bySource.get(source)?.leads ?? 0,
      won: bySource.get(source)?.won ?? 0,
      wonValue: bySource.get(source)?.wonValue ?? 0,
    })).filter((row) => row.leads > 0),
    leadsByStage: LEAD_STAGES.map((stage) => ({
      stage,
      label: LEAD_STAGE_LABELS[stage],
      leads: byStage.get(stage)?.leads ?? 0,
      budget: byStage.get(stage)?.budget ?? 0,
    })),
    quotationsByStatus: LEAD_QUOTATION_STATUSES.map((status) => ({
      status,
      label: LEAD_QUOTATION_STATUS_LABELS[status],
      quotes: byQuoteStatus.get(status)?.quotes ?? 0,
      value: byQuoteStatus.get(status)?.value ?? 0,
    })),
    weeklyTrend: weeks.map((w) => ({
      label: w.label,
      newLeads: newLeadsByWeek.get(w.key) ?? 0,
      followups: followupsByWeek.get(w.key) ?? 0,
    })),
    pipeline: LEAD_SOURCES.filter((source) => pipelineBySource.has(source)).map((source) => {
      const byStageCounts = pipelineBySource.get(source) ?? {};
      return {
        source,
        label: LEAD_SOURCE_LABELS[source],
        byStage: byStageCounts,
        total: Object.values(byStageCounts).reduce((a, b) => a + b, 0),
      };
    }),
    insights,
  };
}

function statusLabelFor(lead: LeadRow, today: Date): string {
  if (lead.stage === "won") return "Won";
  if (lead.stage === "lost") return "Closed";
  if (!lead.next_followup_date) return "No follow-up set";
  const diff = -daysBetween(lead.next_followup_date, today);
  if (diff <= 0) return "Call today";
  return `Next in ${diff} day${diff === 1 ? "" : "s"}`;
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
