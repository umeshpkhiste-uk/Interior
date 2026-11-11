import { describe, expect, it } from "vitest";
import { autoCornerQty, kitchenCost, kitchenPrice } from "@/lib/calculations/kitchen";

describe("autoCornerQty", () => {
  it("u_shaped -> 2, l_shaped/island -> 1, straight/parallel -> 0", () => {
    expect(autoCornerQty("u_shaped")).toBe(2);
    expect(autoCornerQty("l_shaped")).toBe(1);
    expect(autoCornerQty("island")).toBe(1);
    expect(autoCornerQty("straight")).toBe(0);
    expect(autoCornerQty("parallel")).toBe(0);
  });
});

describe("kitchenCost", () => {
  it("computes cabinets, countertop, hardware, material, labour", () => {
    const result = kitchenCost({
      baseRft: 10,
      wallRft: 8,
      tallQty: 1,
      cornerQty: 1,
      baseRate: 1500,
      wallRate: 1200,
      tallRate: 18000,
      cornerRate: 3000,
      countertopArea: 15,
      countertopRate: 200,
      accessoriesTotal: 5000,
      wastagePct: 0,
      installLabourPct: 0.15,
    });
    const cabinets = 10 * 1500 + 8 * 1200 + 1 * 18000 + 1 * 3000;
    const countertop = 15 * 200;
    expect(result.cabinets).toBe(cabinets);
    expect(result.countertop).toBe(countertop);
    expect(result.hardware).toBe(5000);
    expect(result.material).toBe(cabinets + countertop + 5000);
    expect(result.labour).toBeCloseTo(result.material * 0.15, 5);
    expect(result.cost).toBeCloseTo(result.material * 1.15, 5);
  });

  it("applies wastage only to area-based cabinet+countertop cost, not hardware", () => {
    const base = kitchenCost({
      baseRft: 10, wallRft: 0, tallQty: 0, cornerQty: 0,
      baseRate: 1000, wallRate: 0, tallRate: 0, cornerRate: 0,
      countertopArea: 0, countertopRate: 0, accessoriesTotal: 1000,
      wastagePct: 0.1, installLabourPct: 0,
    });
    expect(base.material).toBeCloseTo(10 * 1000 * 1.1 + 1000, 5);
  });
});

describe("kitchenPrice", () => {
  it("replicates the margin-on-price formula rounded up to the rounding unit", () => {
    // cost 85,000, 15% margin -> 100,000 exactly, nearest 1000 unchanged
    expect(kitchenPrice(85000, 0.15, 1000)).toBeCloseTo(100000, 2);
  });
});
