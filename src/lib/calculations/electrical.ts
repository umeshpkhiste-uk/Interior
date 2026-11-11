/**
 * Electrical Points (Excel sheet 08). See EXCEL_TO_WEBAPP_MAPPING.md sheet
 * 08 section and decision #6: point rates are genuinely quoted all-in in
 * this trade; the labour-share % is a retroactive reporting split only,
 * never a bottom-up calculation.
 */
import { assertNonNegative, priceWithMarginAndRounding } from "./shared";

export interface ElectricalPointRow {
  qty: number;
  allInRate: number;
}

/** RoomCost = Σ(qty × allInRate) across every point-type row (profile lighting included, rft-based qty). */
export function roomPointsCost(rows: ElectricalPointRow[]): number {
  return rows.reduce((sum, row) => {
    assertNonNegative(row.qty, "qty");
    return sum + row.qty * row.allInRate;
  }, 0);
}

export interface ElectricalProjectCostInput {
  /** Sum of roomPointsCost across every room in the project. */
  totalPointsCost: number;
  dbMcbCost: number;
  labourSharePct: number;
}

export interface ElectricalCostBreakdown {
  material: number;
  labour: number;
  cost: number;
}

/** Material = PointsCost×(1−labourShare)+DB; Labour = PointsCost×labourShare (reporting split only). */
export function electricalCost(input: ElectricalProjectCostInput): ElectricalCostBreakdown {
  const material = input.totalPointsCost * (1 - input.labourSharePct) + input.dbMcbCost;
  const labour = input.totalPointsCost * input.labourSharePct;
  return { material, labour, cost: material + labour };
}

export function electricalPrice(cost: number, marginPct: number, roundingUnit: number): number {
  return priceWithMarginAndRounding(cost, marginPct, roundingUnit);
}
