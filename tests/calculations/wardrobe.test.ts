import { describe, expect, it } from "vitest";
import {
  totalWardrobePrice,
  wardrobeCost,
  wardrobeLoftSqFt,
  wardrobePrice,
  wardrobeSqFt,
} from "@/lib/calculations/wardrobe";

describe("wardrobeSqFt / wardrobeLoftSqFt", () => {
  it("SqFt = W×H", () => {
    expect(wardrobeSqFt(8, 7)).toBe(56);
  });

  it("LoftSqFt = hasLoft ? W×loftHeight : 0", () => {
    expect(wardrobeLoftSqFt(8, true, 2)).toBe(16);
    expect(wardrobeLoftSqFt(8, false, 2)).toBe(0);
  });
});

describe("wardrobeCost", () => {
  it("uses the sliding rate for sliding shutters and hinged rate otherwise", () => {
    const sliding = wardrobeCost({
      width: 8, height: 7, depth: 2, shutterType: "sliding",
      hingedRate: 1500, slidingRate: 1800, hasLoft: false, loftHeight: 0,
      loftRate: 0, componentsTotal: 0, installLabourPct: 0,
    });
    expect(sliding.material).toBe(56 * 1800);

    const hinged = wardrobeCost({
      width: 8, height: 7, depth: 2, shutterType: "hinged",
      hingedRate: 1500, slidingRate: 1800, hasLoft: false, loftHeight: 0,
      loftRate: 0, componentsTotal: 0, installLabourPct: 0,
    });
    expect(hinged.material).toBe(56 * 1500);
  });

  it("open shutters have no shutter material cost (frame/internals only)", () => {
    const open = wardrobeCost({
      width: 8, height: 7, depth: 2, shutterType: "open",
      hingedRate: 1500, slidingRate: 1800, hasLoft: false, loftHeight: 0,
      loftRate: 0, componentsTotal: 2000, installLabourPct: 0,
    });
    expect(open.material).toBe(2000);
  });

  it("Material = shutterCost + loftSqFt×loftRate + components; Cost = Material×(1+labourPct)", () => {
    const result = wardrobeCost({
      width: 8, height: 7, depth: 2, shutterType: "hinged",
      hingedRate: 1500, slidingRate: 0, hasLoft: true, loftHeight: 2,
      loftRate: 800, componentsTotal: 3000, installLabourPct: 0.1,
    });
    const material = 56 * 1500 + 16 * 800 + 3000;
    expect(result.material).toBe(material);
    expect(result.cost).toBeCloseTo(material * 1.1, 5);
  });
});

describe("wardrobePrice + totalWardrobePrice (decision #5)", () => {
  it("sums already-individually-rounded prices rather than re-rounding a total", () => {
    const p1 = wardrobePrice(42000, 0.2, 500); // 52,500 -> 52,500 (exact)
    const p2 = wardrobePrice(31000, 0.2, 500); // 38,750 -> 39,000 rounded up
    expect(p1).toBeCloseTo(52500, 2);
    expect(p2).toBeCloseTo(39000, 2);
    expect(totalWardrobePrice([p1, p2])).toBeCloseTo(52500 + 39000, 2);
  });
});
