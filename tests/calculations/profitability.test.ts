import { describe, expect, it } from "vitest";
import { computeHeadProfitability, computeProjectProfitability, otherHeadQuotedPrice } from "@/lib/calculations/profitability";

describe("computeHeadProfitability", () => {
  it("Overhead=(Material+Labour)×overhead%; Cost=Material+Labour+Overhead", () => {
    const head = computeHeadProfitability(
      { name: "Kitchen", material: 60000, labour: 15000, quotedPrice: 100000 },
      0.1,
      0.2
    );
    expect(head.overhead).toBeCloseTo((60000 + 15000) * 0.1, 5);
    expect(head.cost).toBeCloseTo(60000 + 15000 + head.overhead, 5);
  });

  it("Margin=QuotedPrice-Cost; Margin%=Margin/QuotedPrice", () => {
    const head = computeHeadProfitability(
      { name: "Kitchen", material: 60000, labour: 15000, quotedPrice: 100000 },
      0.1,
      0.2
    );
    expect(head.margin).toBeCloseTo(100000 - head.cost, 5);
    expect(head.marginPct).toBeCloseTo(head.margin / 100000, 5);
  });

  it("flags belowTarget when marginPct < targetMarginPct", () => {
    const ok = computeHeadProfitability({ name: "A", material: 10000, labour: 0, quotedPrice: 20000 }, 0, 0.2);
    const below = computeHeadProfitability({ name: "B", material: 19000, labour: 0, quotedPrice: 20000 }, 0, 0.2);
    expect(ok.belowTarget).toBe(false);
    expect(below.belowTarget).toBe(true);
  });
});

describe("otherHeadQuotedPrice", () => {
  it("MAX(0, BOQtotal - namedHeadsQuoted)", () => {
    expect(otherHeadQuotedPrice(1000000, 700000)).toBe(300000);
    expect(otherHeadQuotedPrice(1000000, 1200000)).toBe(0);
  });
});

describe("computeProjectProfitability", () => {
  it("TotalCost = heads cost + supervision + contingencyAndExtras", () => {
    const heads = [
      computeHeadProfitability({ name: "Kitchen", material: 60000, labour: 15000, quotedPrice: 100000 }, 0.1, 0.2),
      computeHeadProfitability({ name: "Wardrobe", material: 40000, labour: 10000, quotedPrice: 70000 }, 0.1, 0.2),
    ];
    const result = computeProjectProfitability({
      heads, supervisorMonthlyCost: 20000, projectDurationMonths: 3, contingencyAndExtras: 15000, discountAmount: 5000,
    });
    const headsCost = heads.reduce((s, h) => s + h.cost, 0);
    const headsQuoted = heads.reduce((s, h) => s + h.quotedPrice, 0);
    expect(result.supervision).toBe(60000);
    expect(result.totalCost).toBeCloseTo(headsCost + 60000 + 15000, 5);
    expect(result.totalQuoted).toBeCloseTo(headsQuoted + 15000 - 5000, 5);
    expect(result.actualProfit).toBeCloseTo(result.totalQuoted - result.totalCost, 5);
  });

  it("never computes profit as quotedPrice - materialCost (must include labour+overhead+supervision)", () => {
    const heads = [computeHeadProfitability({ name: "Kitchen", material: 60000, labour: 15000, quotedPrice: 100000 }, 0.1, 0.2)];
    const result = computeProjectProfitability({
      heads, supervisorMonthlyCost: 5000, projectDurationMonths: 2, contingencyAndExtras: 0, discountAmount: 0,
    });
    const naiveProfit = 100000 - 60000;
    expect(result.actualProfit).not.toBeCloseTo(naiveProfit, 0);
  });
});
