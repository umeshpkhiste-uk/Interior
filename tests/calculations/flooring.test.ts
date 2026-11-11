import { describe, expect, it } from "vitest";
import { flooringCost } from "@/lib/calculations/flooring";

const base = {
  flooringType: "vitrified" as const,
  roomArea: 150,
  tileLength: 2,
  tileWidth: 2,
  wastagePct: 0.1,
  pricePerBox: 1800,
  piecesPerBox: 4,
  layingLabourRate: 25,
  adhesiveGroutRate: 10,
  skirtingLength: 60,
  skirtingRate: 35,
};

describe("flooringCost", () => {
  it("no_work zeroes the room entirely (decision #14)", () => {
    const result = flooringCost({ ...base, flooringType: "no_work" });
    expect(result).toEqual({ tiles: 0, boxes: 0, material: 0, labour: 0, cost: 0 });
  });

  it("Tiles = ROUNDUP(roomArea×(1+wastage)/(tileL×tileW)); Boxes = ROUNDUP(tiles/piecesPerBox)", () => {
    const result = flooringCost(base);
    const expectedTiles = Math.ceil((150 * 1.1) / 4);
    expect(result.tiles).toBe(expectedTiles);
    expect(result.boxes).toBe(Math.ceil(expectedTiles / 4));
  });

  it("Material = tileCost + skirting + roomArea×adhesiveGrout; Labour = roomArea×layingLabour only", () => {
    // Verified against the source workbook's own sample (sheet 07): adhesive & grout is
    // counted as material in the Material-vs-Labour split, not labour.
    const result = flooringCost(base);
    const expectedMaterial = result.boxes * 1800 + 60 * 35 + 150 * 10;
    expect(result.material).toBe(expectedMaterial);
    expect(result.labour).toBe(150 * 25);
    expect(result.cost).toBe(result.material + result.labour);
  });
});
