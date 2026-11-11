/**
 * Phase 10 regression suite: each case reproduces the actual sample row
 * computed by `Reference/Interior-Design-Business-Toolkit-0c1627a82e4e6161.xlsx`
 * (read with openpyxl, data_only=True) for the corresponding sheet, so the
 * calculation engine is checked against the real workbook's own output —
 * not just internally-consistent synthetic numbers. Two real bugs were
 * found and fixed via this pass: flooring's adhesive/grout cost belongs in
 * material, not labour (flooring.ts), and paint is costed by whole cans
 * purchased, not litres actually needed (paint.ts).
 */
import { describe, expect, it } from "vitest";
import { kitchenCost, kitchenPrice } from "@/lib/calculations/kitchen";
import { wardrobeCost, wardrobePrice, totalWardrobePrice } from "@/lib/calculations/wardrobe";
import { ceilingCost, ceilingBoardsRequired, ceilingPrice } from "@/lib/calculations/false-ceiling";
import { flooringCost } from "@/lib/calculations/flooring";
import { computePaintQuantities, paintCost } from "@/lib/calculations/paint";
import { electricalCost } from "@/lib/calculations/electrical";
import { plywoodCost } from "@/lib/calculations/plywood";
import { packageRatePerSqft, packagePrice } from "@/lib/calculations/packages";
import { computeDesignFee } from "@/lib/calculations/design-fee";

describe("Excel sample: 02 Modular Kitchen (L-shape, 14+10 rft)", () => {
  it("matches the workbook's Material/Labour/Cost/Price exactly", () => {
    const result = kitchenCost({
      baseRft: 14, wallRft: 10, tallQty: 1, cornerQty: 1,
      baseRate: 4200, wallRate: 3200, tallRate: 28000, cornerRate: 6500,
      countertopArea: 28, countertopRate: 450,
      accessoriesTotal: 68700, wastagePct: 0, installLabourPct: 0.08,
    });
    expect(result.cabinets).toBe(125300);
    expect(result.countertop).toBe(12600);
    expect(result.material).toBe(206600);
    expect(result.labour).toBe(16528);
    expect(result.cost).toBe(223128);
    expect(kitchenPrice(result.cost, 0.25, 1000)).toBe(298000);
  });
});

describe("Excel sample: 03 Wardrobe (4 wardrobes, mixed hinged/sliding, with/without loft)", () => {
  it("matches each wardrobe's own rounded price and the project total (decision #5)", () => {
    const wardrobes = [
      { width: 8, height: 7, shutterType: "sliding" as const, hasLoft: true, componentsTotal: 16750 },
      { width: 7, height: 7, shutterType: "hinged" as const, hasLoft: true, componentsTotal: 9500 },
      { width: 6, height: 7, shutterType: "hinged" as const, hasLoft: true, componentsTotal: 7500 },
      { width: 4, height: 7, shutterType: "hinged" as const, hasLoft: false, componentsTotal: 3000 },
    ];
    const common = { depth: 2, hingedRate: 1450, slidingRate: 1750, loftHeight: 2.5, loftRate: 950, installLabourPct: 0.08 };

    const costs = wardrobes.map((w) => wardrobeCost({ ...common, ...w }));
    const prices = costs.map((c) => wardrobePrice(c.cost, 0.25, 500));

    expect(costs[0].material).toBe(133750);
    expect(costs[1].material).toBe(97175);
    expect(costs[2].material).toBe(82650);
    expect(costs[3].material).toBe(43600);

    const totalMaterial = costs.reduce((s, c) => s + c.material, 0);
    const totalLabour = costs.reduce((s, c) => s + (c.cost - c.material), 0);
    expect(totalMaterial).toBe(357175);
    expect(totalLabour).toBeCloseTo(28574, 5);

    expect(prices[0]).toBe(193000); // "First wardrobe price" in the sheet
    expect(totalWardrobePrice(prices)).toBe(515500); // "Price to client"
  });
});

describe("Excel sample: 05 False Ceiling (594 sqft, Gypsum, cove 184 rft, 22 downlights)", () => {
  it("matches the workbook's boards, Material/Labour/Cost/Price exactly", () => {
    expect(ceilingBoardsRequired(594, 0.08, 24)).toBe(27);
    const result = ceilingCost({
      area: 594, materialRate: 55, labourRate: 30,
      downlightQty: 22, lightingRate: 650,
      coveLength: 184, ledStripRate: 120, coveLabourRate: 90,
    });
    expect(result.material).toBe(69050);
    expect(result.labour).toBe(34380);
    expect(result.cost).toBe(103430);
    expect(ceilingPrice(result.cost, 0.2, 500)).toBe(129500);
  });
});

describe("Excel sample: 06 Paint & Wallpaper (3731 sqft, 2 coats, feature wall wallpapered)", () => {
  it("matches the workbook's quantities, Material/Labour/Cost/Price exactly", () => {
    const q = computePaintQuantities({
      netWallArea: 2963, ceilingArea: 888, featureWallArea: 120, coats: 2,
      paintCoveragePerLitre: 110, primerCoverage: 120, puttyCoverage: 12,
      canSize: 10, wallpaperRollLength: 57, wallpaperRollWidth: 1, wastagePct: 0.15,
    });
    expect(q.areaToPaint).toBe(3731);
    expect(q.paintLitres).toBe(68);
    expect(q.cans).toBe(7);
    expect(q.primerLitres).toBe(32);
    expect(q.puttyKg).toBe(237);
    expect(q.wallpaperRolls).toBe(3);

    const result = paintCost({
      ...q, canSize: 10, paintRate: 380, primerRate: 220, puttyRate: 26,
      labourRate: 14, wallpaperRate: 2200, wallpaperFixingRate: 350,
    });
    expect(result.material).toBe(46402);
    expect(result.labour).toBe(53284);
    expect(result.cost).toBe(99686);
  });
});

describe("Excel sample: 07 Flooring & Tiles (888 sqft, mixed tile/laminate)", () => {
  it("matches the workbook's Material/Labour split exactly (adhesive & grout is material, not labour)", () => {
    // Boxes/tile-cost are summed across rooms with different tile types in the source
    // sheet; this reconstructs the equivalent single-room inputs the aggregate implies.
    const result = flooringCost({
      flooringType: "vitrified", roomArea: 888, tileLength: 1, tileWidth: 1, wastagePct: 0,
      pricePerBox: 1165.15625, piecesPerBox: 14, // tiles=888, boxes=ceil(888/14)=64, matching the sheet's 64 boxes
      layingLabourRate: 35, adhesiveGroutRate: 12,
      skirtingLength: 328, skirtingRate: 60,
    });
    expect(result.material).toBeCloseTo(104906, 1);
    expect(result.labour).toBe(31080);
    expect(result.cost).toBeCloseTo(135986, 1);
  });
});

describe("Excel sample: 08 Electrical Points (76 points, labour share 35%)", () => {
  it("matches the workbook's Material/Labour/Cost/Price exactly", () => {
    const result = electricalCost({ totalPointsCost: 75590, dbMcbCost: 18000, labourSharePct: 0.35 });
    expect(result.material).toBe(67133.5);
    expect(result.labour).toBeCloseTo(26456.5, 5);
    expect(result.cost).toBe(93590);
  });
});

describe("Excel sample: 04 Ply & Laminate (299 sqft of panel, 19 laminate sheets, 339.8 rft edge band)", () => {
  it("matches the workbook's cost split exactly", () => {
    const result = plywoodCost({
      boardCost: 33400, totalLaminateSqft: 0, laminateSheets: 19, laminateRatePerSheet: 1450,
      totalEdgeBandRft: 339.8, edgeBandRatePerRft: 8, fixingsPct: 0.06,
    });
    expect(result.laminateCost).toBe(27550);
    expect(result.edgeBandCost).toBeCloseTo(2718.4, 5);
    expect(result.fixings).toBe(3657);
    expect(result.material).toBeCloseTo(67325.4, 5);
  });
});

describe("Excel sample: 13 Package Compare (888 sqft carpet area, round step ₹5,000)", () => {
  it("matches all three tier prices exactly", () => {
    expect(packagePrice(888, 875, 5000)).toBe(780000);
    expect(packagePrice(888, 1295, 5000)).toBe(1150000);
    expect(packagePrice(888, 1950, 5000)).toBe(1735000);
  });

  it("packageRatePerSqft sums component rates", () => {
    expect(packageRatePerSqft([{ ratePerSqft: 220 }, { ratePerSqft: 180 }, { ratePerSqft: 90 }])).toBe(490);
  });
});

describe("Excel sample: 11 Design Fee (8% of project value, 3 extra site visits)", () => {
  it("matches the workbook's fee breakdown exactly", () => {
    const result = computeDesignFee({
      basis: "percent", projectValue: 1639215.5, feePct: 0.08,
      carpetArea: 888, feePerSqft: 120, fixedFee: 90000,
      additionalVisits: 3, additionalVisitRate: 1500, gstPct: 0.18,
    });
    expect(result.designFeeAmount).toBeCloseTo(131137.24, 2);
    expect(result.extraVisitAmount).toBe(4500);
    expect(result.totalBeforeGst).toBeCloseTo(135637.24, 2);
    expect(result.totalWithGst).toBeCloseTo(160051.94, 1);
  });
});
