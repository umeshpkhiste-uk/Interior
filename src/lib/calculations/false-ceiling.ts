/**
 * False Ceiling (Excel sheet 05). See EXCEL_TO_WEBAPP_MAPPING.md sheet 05
 * section. Floor area is a live reference to project_rooms, not a snapshot.
 */
import { assertNonNegative, priceWithMarginAndRounding } from "./shared";

/** CeilingSqft = FloorArea × CoverPct (lets a room be partially covered, e.g. peripheral = 0.6). */
export function ceilingCoverageArea(floorArea: number, coverPct: number): number {
  assertNonNegative(floorArea, "floorArea");
  return floorArea * coverPct;
}

/** Boards = ROUNDUP(area×(1+wastage)/boardSize). */
export function ceilingBoardsRequired(area: number, wastagePct: number, boardSizeSqft: number): number {
  if (boardSizeSqft <= 0) return 0;
  return Math.ceil((area * (1 + wastagePct)) / boardSizeSqft);
}

export interface CeilingCostInput {
  area: number;
  materialRate: number;
  labourRate: number;
  downlightQty: number;
  lightingRate: number;
  coveLength: number;
  ledStripRate: number;
  coveLabourRate: number;
}

export interface CeilingCostBreakdown {
  material: number;
  labour: number;
  cost: number;
}

export function ceilingCost(input: CeilingCostInput): CeilingCostBreakdown {
  const material =
    input.area * input.materialRate +
    input.downlightQty * input.lightingRate +
    input.coveLength * input.ledStripRate;
  const labour = input.area * input.labourRate + input.coveLength * input.coveLabourRate;
  return { material, labour, cost: material + labour };
}

export function ceilingPrice(cost: number, marginPct: number, roundingUnit: number): number {
  return priceWithMarginAndRounding(cost, marginPct, roundingUnit);
}
