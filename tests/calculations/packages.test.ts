import { describe, expect, it } from "vitest";
import { packagePrice, packageRatePerSqft } from "@/lib/calculations/packages";

describe("packageRatePerSqft", () => {
  it("sums the component rates for a tier", () => {
    expect(packageRatePerSqft([{ ratePerSqft: 120 }, { ratePerSqft: 80 }, { ratePerSqft: 45 }])).toBe(245);
  });
});

describe("packagePrice", () => {
  it("rounds up to the nearest round step when roundStep > 0", () => {
    expect(packagePrice(1200, 245, 5000)).toBe(Math.ceil((1200 * 245) / 5000) * 5000);
  });

  it("returns the raw price when roundStep is 0", () => {
    expect(packagePrice(1200, 245, 0)).toBe(1200 * 245);
  });
});
