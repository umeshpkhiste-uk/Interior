/**
 * Paint & Wallpaper (Excel sheet 06). See EXCEL_TO_WEBAPP_MAPPING.md sheet
 * 06 section and decision #16.
 */
import { assertNonNegative, priceWithMarginAndRounding } from "./shared";

export interface PaintQuantitiesInput {
  netWallArea: number;
  ceilingArea: number;
  featureWallArea: number;
  coats: number;
  paintCoveragePerLitre: number;
  primerCoverage: number;
  puttyCoverage: number;
  canSize: number;
  wallpaperRollLength: number;
  wallpaperRollWidth: number;
  wastagePct: number;
}

export interface PaintQuantities {
  areaToPaint: number;
  paintLitres: number;
  cans: number;
  primerLitres: number;
  puttyKg: number;
  wallpaperRolls: number;
}

export function computePaintQuantities(input: PaintQuantitiesInput): PaintQuantities {
  assertNonNegative(input.netWallArea, "netWallArea");
  assertNonNegative(input.featureWallArea, "featureWallArea");
  const paintableWallArea = Math.max(0, input.netWallArea - input.featureWallArea);
  const areaToPaint = paintableWallArea + input.ceilingArea;

  const paintLitres = input.paintCoveragePerLitre > 0
    ? Math.ceil((areaToPaint * input.coats) / input.paintCoveragePerLitre)
    : 0;
  const cans = input.canSize > 0 ? Math.ceil(paintLitres / input.canSize) : 0;
  const primerLitres = input.primerCoverage > 0 ? Math.ceil(areaToPaint / input.primerCoverage) : 0;
  const puttyKg = input.puttyCoverage > 0 ? Math.ceil(paintableWallArea / input.puttyCoverage) : 0;
  const rollCoverage = input.wallpaperRollLength * input.wallpaperRollWidth;
  const wallpaperRolls =
    rollCoverage > 0 ? Math.ceil((input.featureWallArea * (1 + input.wastagePct)) / rollCoverage) : 0;

  return { areaToPaint, paintLitres, cans, primerLitres, puttyKg, wallpaperRolls };
}

export interface PaintCostInput extends PaintQuantities {
  paintRate: number;
  primerRate: number;
  puttyRate: number;
  labourRate: number;
  wallpaperRate: number;
  wallpaperFixingRate: number;
}

export interface PaintCostBreakdown {
  material: number;
  labour: number;
  cost: number;
}

export function paintCost(input: PaintCostInput): PaintCostBreakdown {
  // `cans` is a purchasing-quantity derivation only; cost is priced per litre.
  const material =
    input.paintLitres * input.paintRate +
    input.primerLitres * input.primerRate +
    input.puttyKg * input.puttyRate +
    input.wallpaperRolls * input.wallpaperRate;
  const labour = input.areaToPaint * input.labourRate + input.wallpaperRolls * input.wallpaperFixingRate;
  return { material, labour, cost: material + labour };
}

export function paintPrice(cost: number, marginPct: number, roundingUnit: number): number {
  return priceWithMarginAndRounding(cost, marginPct, roundingUnit);
}
