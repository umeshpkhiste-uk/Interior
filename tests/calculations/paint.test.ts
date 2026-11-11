import { describe, expect, it } from "vitest";
import { computePaintQuantities, paintCost } from "@/lib/calculations/paint";

const baseInput = {
  netWallArea: 400,
  ceilingArea: 150,
  featureWallArea: 50,
  coats: 2,
  paintCoveragePerLitre: 120,
  primerCoverage: 140,
  puttyCoverage: 20,
  canSize: 10,
  wallpaperRollLength: 33,
  wallpaperRollWidth: 1.75,
  wastagePct: 0.1,
};

describe("computePaintQuantities", () => {
  it("AreaToPaint = MAX(0, WallArea-FeatureWall) + CeilingArea", () => {
    const q = computePaintQuantities(baseInput);
    expect(q.areaToPaint).toBe((400 - 50) + 150);
  });

  it("Putty excludes the ceiling and uses the paintable wall area only", () => {
    const q = computePaintQuantities(baseInput);
    expect(q.puttyKg).toBe(Math.ceil((400 - 50) / 20));
  });

  it("Paint litres = ROUNDUP(area×coats/coverage); Cans = ROUNDUP(litres/canSize)", () => {
    const q = computePaintQuantities(baseInput);
    const expectedLitres = Math.ceil((q.areaToPaint * 2) / 120);
    expect(q.paintLitres).toBe(expectedLitres);
    expect(q.cans).toBe(Math.ceil(expectedLitres / 10));
  });

  it("WallpaperRolls = ROUNDUP(featureWall×(1+wastage)/rollCoverage)", () => {
    const q = computePaintQuantities(baseInput);
    const rollCoverage = 33 * 1.75;
    expect(q.wallpaperRolls).toBe(Math.ceil((50 * 1.1) / rollCoverage));
  });

  it("clamps paintable wall area at 0 when feature wall exceeds net wall area", () => {
    const q = computePaintQuantities({ ...baseInput, netWallArea: 30, featureWallArea: 50 });
    expect(q.puttyKg).toBe(0);
  });
});

describe("paintCost", () => {
  it("Labour = areaToPaint×labourRate + wallpaperRolls×fixingRate", () => {
    const q = computePaintQuantities(baseInput);
    const result = paintCost({
      ...q, canSize: 10, paintRate: 300, primerRate: 150, puttyRate: 25, labourRate: 18,
      wallpaperRate: 2500, wallpaperFixingRate: 400,
    });
    expect(result.labour).toBeCloseTo(q.areaToPaint * 18 + q.wallpaperRolls * 400, 5);
    expect(result.material).toBeCloseTo(
      q.cans * 10 * 300 + q.primerLitres * 150 + q.puttyKg * 25 + q.wallpaperRolls * 2500,
      5
    );
  });

  it("Paint is costed by whole cans purchased, not litres actually needed (source sheet: 68L needed, 7 cans × 10L × ₹380 = ₹26,600, not 68×380=₹25,840)", () => {
    const result = paintCost({
      areaToPaint: 3731, paintLitres: 68, cans: 7, primerLitres: 32, puttyKg: 237, wallpaperRolls: 3,
      canSize: 10, paintRate: 380, primerRate: 220, puttyRate: 26, labourRate: 14,
      wallpaperRate: 2200, wallpaperFixingRate: 350,
    });
    expect(result.material).toBe(46402);
    expect(result.labour).toBe(53284);
    expect(result.cost).toBe(99686);
  });
});
