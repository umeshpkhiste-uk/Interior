/**
 * Package Compare (Excel sheet 13). See EXCEL_TO_WEBAPP_MAPPING.md sheet
 * 13 section.
 */
import { assertNonNegative } from "./shared";

export interface PackageComponentRate {
  ratePerSqft: number;
}

/** TierRatePerSqft = Σ(component rates for that tier). */
export function packageRatePerSqft(components: PackageComponentRate[]): number {
  return components.reduce((sum, c) => sum + c.ratePerSqft, 0);
}

/** TierPrice = roundStep>0 ? ROUNDUP(area×rate/roundStep)×roundStep : area×rate. */
export function packagePrice(area: number, ratePerSqft: number, roundStep: number): number {
  assertNonNegative(area, "area");
  const raw = area * ratePerSqft;
  if (roundStep <= 0) return raw;
  return Math.ceil(raw / roundStep) * roundStep;
}
