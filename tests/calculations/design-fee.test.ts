import { describe, expect, it } from "vitest";
import { computeDesignFee } from "@/lib/calculations/design-fee";

const base = {
  projectValue: 2000000, feePct: 0.08, carpetArea: 1200, feePerSqft: 150,
  fixedFee: 150000, additionalVisits: 2, additionalVisitRate: 2000, gstPct: 0.18,
};

describe("computeDesignFee", () => {
  it("percent basis: Fee = projectValue × feePct", () => {
    const result = computeDesignFee({ ...base, basis: "percent" });
    expect(result.designFeeAmount).toBeCloseTo(2000000 * 0.08, 5);
  });

  it("per_sqft basis: Fee = carpetArea × feePerSqft", () => {
    const result = computeDesignFee({ ...base, basis: "per_sqft" });
    expect(result.designFeeAmount).toBe(1200 * 150);
  });

  it("fixed basis: Fee = fixedFee", () => {
    const result = computeDesignFee({ ...base, basis: "fixed" });
    expect(result.designFeeAmount).toBe(150000);
  });

  it("ExtraVisits = additionalVisits × rate (always additive, never a credit)", () => {
    const positive = computeDesignFee({ ...base, basis: "fixed" });
    expect(positive.extraVisitAmount).toBe(2 * 2000);
  });

  it("rejects a negative visit count rather than silently treating it as a credit", () => {
    expect(() => computeDesignFee({ ...base, basis: "fixed", additionalVisits: -3 })).toThrow();
  });

  it("TotalBeforeGST = Fee+ExtraVisits; TotalWithGST = TotalBeforeGST×(1+gstPct)", () => {
    const result = computeDesignFee({ ...base, basis: "fixed" });
    expect(result.totalBeforeGst).toBe(150000 + 4000);
    expect(result.totalWithGst).toBeCloseTo((150000 + 4000) * 1.18, 5);
  });
});
