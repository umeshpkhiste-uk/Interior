import { describe, expect, it } from "vitest";
import { computeQuotationTotals, paymentStageAmount, paymentStagesSumToFull } from "@/lib/calculations/quotation";

describe("computeQuotationTotals", () => {
  it("Gross = RoomsTotal + Contingency + ExtraItems", () => {
    const totals = computeQuotationTotals({
      roomsTotal: 1000000, contingencyPct: 0.05, extraItemsTotal: 20000,
      discountType: "percent", discountValue: 0, gstPct: 0.18,
    });
    expect(totals.contingencyAmount).toBeCloseTo(50000, 5);
    expect(totals.grossAmount).toBeCloseTo(1070000, 5);
  });

  it("percent discount: Discount = Gross × value", () => {
    const totals = computeQuotationTotals({
      roomsTotal: 1000000, contingencyPct: 0, extraItemsTotal: 0,
      discountType: "percent", discountValue: 0.1, gstPct: 0.18,
    });
    expect(totals.discountAmount).toBeCloseTo(100000, 5);
    expect(totals.taxableAmount).toBeCloseTo(900000, 5);
  });

  it("fixed discount is capped at the gross amount (never negative taxable)", () => {
    const totals = computeQuotationTotals({
      roomsTotal: 10000, contingencyPct: 0, extraItemsTotal: 0,
      discountType: "fixed", discountValue: 50000, gstPct: 0.18,
    });
    expect(totals.discountAmount).toBe(10000);
    expect(totals.taxableAmount).toBe(0);
  });

  it("RoundOff = ROUND(Taxable+GST,0) - (Taxable+GST); GrandTotal is the rounded value", () => {
    const totals = computeQuotationTotals({
      roomsTotal: 100333, contingencyPct: 0, extraItemsTotal: 0,
      discountType: "fixed", discountValue: 0, gstPct: 0.18,
    });
    const preRound = 100333 * 1.18;
    expect(totals.grandTotal).toBe(Math.round(preRound));
    expect(totals.roundOff).toBeCloseTo(Math.round(preRound) - preRound, 5);
  });
});

describe("payment stages", () => {
  it("stage amount = GrandTotal × stageShare%", () => {
    expect(paymentStageAmount(500000, { stagePct: 0.4 })).toBe(200000);
  });

  it("validates stage percentages sum to 100%", () => {
    expect(paymentStagesSumToFull([{ stagePct: 0.4 }, { stagePct: 0.3 }, { stagePct: 0.3 }])).toBe(true);
    expect(paymentStagesSumToFull([{ stagePct: 0.4 }, { stagePct: 0.3 }])).toBe(false);
  });
});
