/**
 * Material vs Labour & Profit Analysis (Excel sheet 12). See
 * EXCEL_TO_WEBAPP_MAPPING.md sheet 12 section and decision #21. The
 * master prompt is explicit that profit must be TotalQuoted − TotalCost,
 * never quotedPrice − materialCost.
 */
import { assertNonNegative } from "./shared";

export interface ProfitabilityHeadInput {
  name: string;
  material: number;
  labour: number;
  quotedPrice: number;
}

export interface ProfitabilityHeadResult extends ProfitabilityHeadInput {
  overhead: number;
  cost: number;
  margin: number;
  marginPct: number;
  belowTarget: boolean;
}

/** Overhead = (Material+Labour)×overhead%; Cost = Material+Labour+Overhead. */
export function computeHeadProfitability(
  head: ProfitabilityHeadInput,
  overheadPct: number,
  targetMarginPct: number
): ProfitabilityHeadResult {
  assertNonNegative(head.material, "material");
  assertNonNegative(head.labour, "labour");

  const overhead = (head.material + head.labour) * overheadPct;
  const cost = head.material + head.labour + overhead;
  const margin = head.quotedPrice - cost;
  const marginPct = head.quotedPrice > 0 ? margin / head.quotedPrice : 0;

  return { ...head, overhead, cost, margin, marginPct, belowTarget: marginPct < targetMarginPct };
}

/** "Other carpentry and furniture" plug row: quoted price = MAX(0, BOQtotal - named heads' quoted prices). */
export function otherHeadQuotedPrice(boqTotal: number, namedHeadsQuotedTotal: number): number {
  return Math.max(0, boqTotal - namedHeadsQuotedTotal);
}

export interface ProjectProfitabilityInput {
  heads: ProfitabilityHeadResult[];
  supervisorMonthlyCost: number;
  projectDurationMonths: number;
  /** Contingency + extra-quotation-items, added at cost to both sides with no margin (mapping doc decision). */
  contingencyAndExtras: number;
  discountAmount: number;
}

export interface ProjectProfitabilityResult {
  totalMaterial: number;
  totalLabour: number;
  totalOverhead: number;
  supervision: number;
  totalCost: number;
  totalQuoted: number;
  actualProfit: number;
  actualMarginPct: number;
}

export function computeProjectProfitability(input: ProjectProfitabilityInput): ProjectProfitabilityResult {
  const totalMaterial = input.heads.reduce((s, h) => s + h.material, 0);
  const totalLabour = input.heads.reduce((s, h) => s + h.labour, 0);
  const totalOverhead = input.heads.reduce((s, h) => s + h.overhead, 0);
  const supervision = input.supervisorMonthlyCost * input.projectDurationMonths;
  const headsCost = input.heads.reduce((s, h) => s + h.cost, 0);
  const headsQuoted = input.heads.reduce((s, h) => s + h.quotedPrice, 0);

  const totalCost = headsCost + supervision + input.contingencyAndExtras;
  const totalQuoted = headsQuoted + input.contingencyAndExtras - input.discountAmount;
  const actualProfit = totalQuoted - totalCost;

  return {
    totalMaterial,
    totalLabour,
    totalOverhead,
    supervision,
    totalCost,
    totalQuoted,
    actualProfit,
    actualMarginPct: totalQuoted > 0 ? actualProfit / totalQuoted : 0,
  };
}
