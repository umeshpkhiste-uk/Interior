import { describe, expect, it } from "vitest";
import { ceilingBoardsRequired, ceilingCost, ceilingCoverageArea } from "@/lib/calculations/false-ceiling";

describe("ceilingCoverageArea", () => {
  it("CeilingSqft = FloorArea × CoverPct", () => {
    expect(ceilingCoverageArea(200, 0.6)).toBe(120);
    expect(ceilingCoverageArea(200, 1)).toBe(200);
  });
});

describe("ceilingBoardsRequired", () => {
  it("Boards = ROUNDUP(area×(1+wastage)/boardSize)", () => {
    expect(ceilingBoardsRequired(100, 0.05, 32)).toBe(Math.ceil((100 * 1.05) / 32));
  });
});

describe("ceilingCost", () => {
  it("Material = area×materialRate + lights×lightingRate + coveLength×ledStripRate", () => {
    const result = ceilingCost({
      area: 120, materialRate: 55, labourRate: 30,
      downlightQty: 6, lightingRate: 250,
      coveLength: 40, ledStripRate: 90, coveLabourRate: 20,
    });
    expect(result.material).toBe(120 * 55 + 6 * 250 + 40 * 90);
  });

  it("Labour = area×labourRate + coveLength×coveLabourRate", () => {
    const result = ceilingCost({
      area: 120, materialRate: 55, labourRate: 30,
      downlightQty: 0, lightingRate: 0,
      coveLength: 40, ledStripRate: 0, coveLabourRate: 20,
    });
    expect(result.labour).toBe(120 * 30 + 40 * 20);
    expect(result.cost).toBe(result.material + result.labour);
  });
});
