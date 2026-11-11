import { getProfitabilityRawData } from "@/lib/data/profitability";
import {
  computeHeadProfitability,
  computeProjectProfitability,
  otherHeadQuotedPrice,
  type ProfitabilityHeadResult,
  type ProjectProfitabilityResult,
} from "@/lib/calculations/profitability";

const HEAD_LABELS: Record<string, string> = {
  kitchen: "Modular Kitchen",
  wardrobe: "Wardrobe",
  plywood: "Plywood & Laminate",
  ceiling: "False Ceiling",
  paint: "Paint & Wallpaper",
  flooring: "Flooring",
  electrical: "Electrical & Lighting",
};

export interface ProfitabilityComputation {
  heads: ProfitabilityHeadResult[];
  project: ProjectProfitabilityResult;
  contingencyAndExtras: number;
  discountAmount: number;
}

/** Shared by the Profitability Report and the Material vs Labour Report — same inputs, different presentation. */
export async function computeProjectProfitabilityReport(organizationId: string, projectId: string): Promise<ProfitabilityComputation> {
  const raw = await getProfitabilityRawData(organizationId, projectId);
  const overheadPct = Number(raw.settings?.overhead_pct ?? 0);
  const targetMarginPct = Number(raw.settings?.target_margin_pct ?? 0.2);

  const namedHeads = Object.entries(raw.heads).map(([key, totals]) =>
    computeHeadProfitability({ name: HEAD_LABELS[key], ...totals }, overheadPct, targetMarginPct)
  );
  const namedHeadsQuotedTotal = namedHeads.reduce((s, h) => s + h.quotedPrice, 0);
  const otherHead = computeHeadProfitability(
    {
      name: "Other Carpentry & Furniture",
      material: Number(raw.settings?.other_head_material_cost ?? 0),
      labour: Number(raw.settings?.other_head_labour_cost ?? 0),
      quotedPrice: otherHeadQuotedPrice(raw.boqSubtotal, namedHeadsQuotedTotal),
    },
    overheadPct,
    targetMarginPct
  );
  const heads = [...namedHeads, otherHead];

  const project = computeProjectProfitability({
    heads,
    supervisorMonthlyCost: Number(raw.settings?.supervisor_monthly_cost ?? 0),
    projectDurationMonths: Number(raw.settings?.project_duration_months ?? 0),
    contingencyAndExtras: raw.contingencyAndExtras,
    discountAmount: raw.discountAmount,
  });

  return { heads, project, contingencyAndExtras: raw.contingencyAndExtras, discountAmount: raw.discountAmount };
}
