import { describe, expect, it } from "vitest";
import { boqSubtotal, computeBoqTotals } from "@/lib/calculations/boq";

const items = [{ amount: 100000 }, { amount: 50000 }, { amount: 25000 }];

describe("boqSubtotal", () => {
  it("sums every line amount", () => {
    expect(boqSubtotal(items)).toBe(175000);
  });
});

describe("computeBoqTotals", () => {
  it("Contingency=Total×%; BeforeGST=Total+Contingency; GST=BeforeGST×%; GrandTotal=BeforeGST+GST", () => {
    const totals = computeBoqTotals(items, 0.05, 0.18, 1000);
    expect(totals.subtotal).toBe(175000);
    expect(totals.contingency).toBeCloseTo(175000 * 0.05, 5);
    expect(totals.beforeGst).toBeCloseTo(175000 * 1.05, 5);
    expect(totals.gst).toBeCloseTo(totals.beforeGst * 0.18, 5);
    expect(totals.grandTotal).toBeCloseTo(totals.beforeGst * 1.18, 5);
  });

  it("PerSqFt = BeforeGST / CarpetArea (before GST)", () => {
    const totals = computeBoqTotals(items, 0.05, 0.18, 1000);
    expect(totals.perSqft).toBeCloseTo(totals.beforeGst / 1000, 5);
  });

  it("returns null perSqft when carpet area is missing or zero", () => {
    expect(computeBoqTotals(items, 0.05, 0.18, null).perSqft).toBeNull();
    expect(computeBoqTotals(items, 0.05, 0.18, 0).perSqft).toBeNull();
  });
});
