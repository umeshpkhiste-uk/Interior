import { describe, expect, it } from "vitest";
import {
  aggregateAreaByBoardGrade,
  computeCutListRow,
  plywoodCost,
  sheetsRequired,
} from "@/lib/calculations/plywood";

describe("computeCutListRow", () => {
  it("Area = Qty×L×W; LaminateSqft = Area×faces; EdgeBandRft = Qty×2×(L+W) when edge-banded", () => {
    const row = computeCutListRow({
      qty: 2, lengthFt: 8, widthFt: 2, boardGrade: "18mm BWR", laminateFaces: 2, hasEdgeBand: true,
    });
    expect(row.area).toBe(32);
    expect(row.laminateSqft).toBe(64);
    expect(row.edgeBandRft).toBe(2 * 2 * (8 + 2));
  });

  it("EdgeBandRft is 0 when not edge-banded", () => {
    const row = computeCutListRow({
      qty: 1, lengthFt: 4, widthFt: 2, boardGrade: "18mm BWR", laminateFaces: 0, hasEdgeBand: false,
    });
    expect(row.edgeBandRft).toBe(0);
    expect(row.laminateSqft).toBe(0);
  });
});

describe("aggregateAreaByBoardGrade", () => {
  it("sums area per board grade, matching the source sheet's SUMIFS", () => {
    const totals = aggregateAreaByBoardGrade([
      { qty: 1, lengthFt: 8, widthFt: 4, boardGrade: "18mm BWR", laminateFaces: 0, hasEdgeBand: false },
      { qty: 1, lengthFt: 4, widthFt: 4, boardGrade: "18mm BWR", laminateFaces: 0, hasEdgeBand: false },
      { qty: 1, lengthFt: 8, widthFt: 4, boardGrade: "12mm MR", laminateFaces: 0, hasEdgeBand: false },
    ]);
    expect(totals.get("18mm BWR")).toBe(32 + 16);
    expect(totals.get("12mm MR")).toBe(32);
  });
});

describe("sheetsRequired", () => {
  it("Sheets = ROUNDUP(area×(1+wastage)/sheetArea)", () => {
    expect(sheetsRequired(100, 0.1, 8, 4)).toBe(Math.ceil((100 * 1.1) / 32));
    expect(sheetsRequired(32, 0, 8, 4)).toBe(1);
  });

  it("returns 0 when sheet dimensions are zero", () => {
    expect(sheetsRequired(100, 0, 0, 4)).toBe(0);
  });
});

describe("plywoodCost", () => {
  it("Fixings = (boards+laminate)×fixingsPct; material sums all four components", () => {
    const result = plywoodCost({
      boardCost: 10000,
      totalLaminateSqft: 200,
      laminateSheets: 7,
      laminateRatePerSheet: 1200,
      totalEdgeBandRft: 50,
      edgeBandRatePerRft: 15,
      fixingsPct: 0.03,
    });
    expect(result.laminateCost).toBe(7 * 1200);
    expect(result.edgeBandCost).toBe(50 * 15);
    expect(result.fixings).toBeCloseTo((10000 + 7 * 1200) * 0.03, 5);
    expect(result.material).toBeCloseTo(10000 + 7 * 1200 + 50 * 15 + result.fixings, 5);
  });
});
