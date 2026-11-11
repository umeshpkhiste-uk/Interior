/**
 * Flooring & Tiles (Excel sheet 07). See EXCEL_TO_WEBAPP_MAPPING.md sheet 07
 * section and decision #14 ("no_work" sentinel zeroes the room entirely).
 */
import { assertNonNegative, priceWithMarginAndRounding } from "./shared";

export type FlooringType =
  | "vitrified" | "ceramic" | "marble" | "granite" | "wooden"
  | "vinyl" | "laminate" | "spc" | "no_work";

export interface FlooringCostInput {
  flooringType: FlooringType;
  roomArea: number;
  tileLength: number;
  tileWidth: number;
  wastagePct: number;
  pricePerBox: number;
  piecesPerBox: number;
  layingLabourRate: number;
  adhesiveGroutRate: number;
  skirtingLength: number;
  skirtingRate: number;
}

export interface FlooringCostBreakdown {
  tiles: number;
  boxes: number;
  material: number;
  labour: number;
  cost: number;
}

export function flooringCost(input: FlooringCostInput): FlooringCostBreakdown {
  if (input.flooringType === "no_work") {
    return { tiles: 0, boxes: 0, material: 0, labour: 0, cost: 0 };
  }
  assertNonNegative(input.roomArea, "roomArea");

  const tileArea = input.tileLength * input.tileWidth;
  const tiles = tileArea > 0 ? Math.ceil((input.roomArea * (1 + input.wastagePct)) / tileArea) : 0;
  const boxes = input.piecesPerBox > 0 ? Math.ceil(tiles / input.piecesPerBox) : 0;

  const tileCost = boxes * input.pricePerBox;
  const skirtingCost = input.skirtingLength * input.skirtingRate;
  const material = tileCost + skirtingCost;
  const labour = input.roomArea * (input.layingLabourRate + input.adhesiveGroutRate);

  return { tiles, boxes, material, labour, cost: material + labour };
}

export function flooringPrice(cost: number, marginPct: number, roundingUnit: number): number {
  return priceWithMarginAndRounding(cost, marginPct, roundingUnit);
}
