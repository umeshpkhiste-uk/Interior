/**
 * Rate Revision (Excel sheet 14). See EXCEL_TO_WEBAPP_MAPPING.md sheet 14
 * section and decisions #13/#19/#22.
 */
import { assertNonNegative } from "./shared";

/** NewRate = ROUNDUP(current×(1+increasePct)/roundStep)×roundStep (default round step ₹5). */
export function computeNewRate(currentRate: number, increasePct: number, roundStep: number): number {
  assertNonNegative(currentRate, "currentRate");
  if (roundStep <= 0) return currentRate * (1 + increasePct);
  return Math.ceil((currentRate * (1 + increasePct)) / roundStep) * roundStep;
}

/** Business-wide (not project-specific) estimated monthly cost impact of a rate change (decision #13). */
export function estimatedMonthlyImpact(newRate: number, currentRate: number, monthlyVolume: number): number {
  return (newRate - currentRate) * monthlyVolume;
}

export type MarketStatus = "below_market" | "within_market" | "above_market" | "unknown";

export function marketStatus(newRate: number, marketLow: number | null, marketHigh: number | null): MarketStatus {
  if (marketLow === null || marketHigh === null) return "unknown";
  if (newRate < marketLow) return "below_market";
  if (newRate > marketHigh) return "above_market";
  return "within_market";
}
