import { describe, expect, it } from "vitest";
import { computeNewRate, estimatedMonthlyImpact, marketStatus } from "@/lib/calculations/rate-revision";

describe("computeNewRate", () => {
  it("NewRate = ROUNDUP(current×(1+increase%)/roundStep)×roundStep", () => {
    expect(computeNewRate(1000, 0.08, 5)).toBe(Math.ceil((1000 * 1.08) / 5) * 5);
    expect(computeNewRate(1000, 0.1, 5)).toBe(1100); // exact multiple stays put
  });

  it("falls back to raw increase when roundStep is 0", () => {
    expect(computeNewRate(1000, 0.1, 0)).toBe(1100);
  });
});

describe("estimatedMonthlyImpact", () => {
  it("(newRate-current)×monthlyVolume — business-wide, not project-specific (decision #13)", () => {
    expect(estimatedMonthlyImpact(1100, 1000, 500)).toBe(50000);
  });
});

describe("marketStatus", () => {
  it("classifies below/within/above market", () => {
    expect(marketStatus(900, 1000, 1200)).toBe("below_market");
    expect(marketStatus(1100, 1000, 1200)).toBe("within_market");
    expect(marketStatus(1300, 1000, 1200)).toBe("above_market");
  });

  it("returns unknown when market range is not set", () => {
    expect(marketStatus(1100, null, null)).toBe("unknown");
  });
});
