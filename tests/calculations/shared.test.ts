import { describe, expect, it } from "vitest";
import {
  applyMarginOnPrice,
  formatINR,
  priceWithMarginAndRounding,
  roundUpToUnit,
} from "@/lib/calculations/shared";

describe("roundUpToUnit", () => {
  it("rounds up to the nearest unit, matching Excel ROUNDUP(value/unit)*unit", () => {
    expect(roundUpToUnit(123456, 1000)).toBe(124000);
    expect(roundUpToUnit(120000, 1000)).toBe(120000); // exact multiple stays put
    expect(roundUpToUnit(120001, 500)).toBe(120500);
  });

  it("returns the value unchanged when unit is 0 or negative", () => {
    expect(roundUpToUnit(123456, 0)).toBe(123456);
  });
});

describe("applyMarginOnPrice", () => {
  it("computes price = cost / (1 - margin), not cost * (1 + margin)", () => {
    // 20% margin on price, cost 80,000 -> price 100,000 (not 96,000)
    expect(applyMarginOnPrice(80000, 0.2)).toBeCloseTo(100000, 5);
  });

  it("returns cost unchanged when margin >= 1 (workbook guard clause)", () => {
    expect(applyMarginOnPrice(50000, 1)).toBe(50000);
    expect(applyMarginOnPrice(50000, 1.5)).toBe(50000);
  });

  it("rejects a negative margin", () => {
    expect(() => applyMarginOnPrice(1000, -0.1)).toThrow();
  });
});

describe("priceWithMarginAndRounding", () => {
  it("matches the kitchen estimator convention (margin-on-price, round to ₹1,000)", () => {
    // cost 212,000 at 15% margin-on-price -> 249,411.76... -> round up to 250,000
    expect(priceWithMarginAndRounding(212000, 0.15, 1000)).toBe(250000);
  });
});

describe("formatINR", () => {
  it("formats using the Indian lakh/crore grouping", () => {
    expect(formatINR(1250000)).toBe("₹12,50,000");
    expect(formatINR(100000)).toBe("₹1,00,000");
    expect(formatINR(999)).toBe("₹999");
    expect(formatINR(10000000)).toBe("₹1,00,00,000");
  });

  it("supports decimals and negative amounts", () => {
    expect(formatINR(1234.5, { decimals: true })).toBe("₹1,234.50");
    expect(formatINR(-5000)).toBe("-₹5,000");
  });
});
