import { describe, expect, it } from "vitest";
import { electricalCost, roomPointsCost } from "@/lib/calculations/electrical";

describe("roomPointsCost", () => {
  it("RoomCost = Σ(qty × allInRate) across every point-type row", () => {
    const rows = [
      { qty: 6, allInRate: 600 }, // lights
      { qty: 4, allInRate: 350 }, // 6A sockets
      { qty: 20, allInRate: 180 }, // profile lighting, rft
    ];
    expect(roomPointsCost(rows)).toBe(6 * 600 + 4 * 350 + 20 * 180);
  });
});

describe("electricalCost", () => {
  it("Material = PointsCost×(1-labourShare)+DB; Labour = PointsCost×labourShare (decision #6)", () => {
    const result = electricalCost({ totalPointsCost: 100000, dbMcbCost: 15000, labourSharePct: 0.35 });
    expect(result.material).toBeCloseTo(100000 * 0.65 + 15000, 5);
    expect(result.labour).toBeCloseTo(100000 * 0.35, 5);
    expect(result.cost).toBeCloseTo(result.material + result.labour, 5);
  });
});
