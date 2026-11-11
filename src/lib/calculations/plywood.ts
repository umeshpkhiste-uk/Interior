/**
 * Ply & Laminate (Excel sheet 04). See EXCEL_TO_WEBAPP_MAPPING.md sheet 04
 * section and decisions #8/#18.
 */
import { assertNonNegative, priceWithMarginAndRounding } from "./shared";

export interface CutListRowInput {
  qty: number;
  lengthFt: number;
  widthFt: number;
  boardGrade: string;
  laminateFaces: 0 | 1 | 2;
  hasEdgeBand: boolean;
}

export interface CutListRowDerived {
  area: number;
  laminateSqft: number;
  edgeBandRft: number;
}

export function computeCutListRow(row: CutListRowInput): CutListRowDerived {
  assertNonNegative(row.qty, "qty");
  assertNonNegative(row.lengthFt, "lengthFt");
  assertNonNegative(row.widthFt, "widthFt");
  const area = row.qty * row.lengthFt * row.widthFt;
  const laminateSqft = area * row.laminateFaces;
  const edgeBandRft = row.hasEdgeBand ? row.qty * 2 * (row.lengthFt + row.widthFt) : 0;
  return { area, laminateSqft, edgeBandRft };
}

/** Groups cut-list rows by board grade and sums area, matching the source sheet's SUMIFS. */
export function aggregateAreaByBoardGrade(rows: CutListRowInput[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const { area } = computeCutListRow(row);
    totals.set(row.boardGrade, (totals.get(row.boardGrade) ?? 0) + area);
  }
  return totals;
}

/** Sheets = ROUNDUP(area×(1+wastage)/sheetArea). */
export function sheetsRequired(area: number, wastagePct: number, sheetLengthFt: number, sheetWidthFt: number): number {
  const sheetArea = sheetLengthFt * sheetWidthFt;
  if (sheetArea <= 0) return 0;
  return Math.ceil((area * (1 + wastagePct)) / sheetArea);
}

export interface PlywoodProjectCostInput {
  /** Board cost per grade, already computed as sheetsRequired × ratePerSheet, summed. */
  boardCost: number;
  totalLaminateSqft: number;
  laminateSheets: number;
  laminateRatePerSheet: number;
  totalEdgeBandRft: number;
  edgeBandRatePerRft: number;
  fixingsPct: number;
}

export interface PlywoodCostBreakdown {
  boardCost: number;
  laminateCost: number;
  edgeBandCost: number;
  fixings: number;
  material: number;
}

export function plywoodCost(input: PlywoodProjectCostInput): PlywoodCostBreakdown {
  const laminateCost = input.laminateSheets * input.laminateRatePerSheet;
  const edgeBandCost = input.totalEdgeBandRft * input.edgeBandRatePerRft;
  const fixings = (input.boardCost + laminateCost) * input.fixingsPct;
  return {
    boardCost: input.boardCost,
    laminateCost,
    edgeBandCost,
    fixings,
    material: input.boardCost + laminateCost + edgeBandCost + fixings,
  };
}

export function plywoodPrice(cost: number, marginPct: number, roundingUnit: number): number {
  return priceWithMarginAndRounding(cost, marginPct, roundingUnit);
}
