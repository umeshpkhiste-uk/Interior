/**
 * Wardrobe (Excel sheet 03). See EXCEL_TO_WEBAPP_MAPPING.md sheet 03 section
 * and decisions #4/#5: every wardrobe gets its own itemized components list,
 * and the project total is the SUM of each wardrobe's already-rounded price
 * (never re-derived from an aggregate cost).
 */
import { assertNonNegative, priceWithMarginAndRounding } from "./shared";

export type ShutterType = "hinged" | "sliding" | "open";

export function wardrobeSqFt(width: number, height: number): number {
  assertNonNegative(width, "width");
  assertNonNegative(height, "height");
  return width * height;
}

export function wardrobeLoftSqFt(width: number, hasLoft: boolean, loftHeight: number): number {
  return hasLoft ? width * loftHeight : 0;
}

export interface WardrobeCostInput {
  width: number;
  height: number;
  depth: number;
  shutterType: ShutterType;
  hingedRate: number;
  slidingRate: number;
  hasLoft: boolean;
  loftHeight: number;
  loftRate: number;
  /** Sum of qty×rate across this wardrobe's wardrobe_components rows. */
  componentsTotal: number;
  installLabourPct: number;
}

export interface WardrobeCostBreakdown {
  sqFt: number;
  loftSqFt: number;
  material: number;
  cost: number;
}

export function wardrobeCost(input: WardrobeCostInput): WardrobeCostBreakdown {
  const sqFt = wardrobeSqFt(input.width, input.height);
  const loftSqFt = wardrobeLoftSqFt(input.width, input.hasLoft, input.loftHeight);
  // "open" shutters have no shutter material cost of their own (frame/internals only).
  const shutterRate = input.shutterType === "sliding" ? input.slidingRate : input.hingedRate;
  const shutterCost = input.shutterType === "open" ? 0 : sqFt * shutterRate;
  const material = shutterCost + loftSqFt * input.loftRate + input.componentsTotal;
  const cost = material * (1 + input.installLabourPct);
  return { sqFt, loftSqFt, material, cost };
}

export function wardrobePrice(cost: number, marginPct: number, roundingUnit: number): number {
  return priceWithMarginAndRounding(cost, marginPct, roundingUnit);
}

/** Decision #5: sum the already-rounded per-wardrobe prices, never re-round the total. */
export function totalWardrobePrice(roundedPrices: number[]): number {
  return roundedPrices.reduce((sum, p) => sum + p, 0);
}
