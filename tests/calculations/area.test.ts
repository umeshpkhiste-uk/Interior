import { describe, expect, it } from "vitest";
import {
  ceilingArea,
  computeProjectAreaTotals,
  computeRoomAreas,
  floorArea,
  grossWallArea,
  netWallArea,
  perimeter,
  toStandardFeet,
  totalOpeningArea,
} from "@/lib/calculations/area";

const livingRoom = { lengthFt: 15, widthFt: 12, heightFt: 10 };

describe("floor / perimeter / wall area", () => {
  it("Floor = L×W", () => {
    expect(floorArea(livingRoom)).toBe(180);
  });

  it("Perimeter = 2(L+W)", () => {
    expect(perimeter(livingRoom)).toBe(54);
  });

  it("GrossWall = Perimeter×H", () => {
    expect(grossWallArea(livingRoom)).toBe(540);
  });

  it("Ceiling = Floor", () => {
    expect(ceilingArea(livingRoom)).toBe(floorArea(livingRoom));
  });
});

describe("openings and net wall", () => {
  it("Openings = Σ(qty×width×height)", () => {
    const openings = [
      { widthFt: 3, heightFt: 7, quantity: 1 }, // one door
      { widthFt: 4, heightFt: 4, quantity: 2 }, // two windows
    ];
    expect(totalOpeningArea(openings)).toBe(3 * 7 * 1 + 4 * 4 * 2);
  });

  it("NetWall = MAX(0, GrossWall-Openings), clamped at zero", () => {
    expect(netWallArea(100, 40)).toBe(60);
    expect(netWallArea(100, 150)).toBe(0);
  });
});

describe("toStandardFeet", () => {
  it("passes feet_inches values through unchanged", () => {
    expect(toStandardFeet(12.5, "feet_inches")).toBe(12.5);
  });

  it("converts metric (meters) to feet", () => {
    expect(toStandardFeet(1, "metric")).toBeCloseTo(3.28084, 5);
  });
});

describe("computeRoomAreas + computeProjectAreaTotals", () => {
  it("aggregates rooms and finds the largest by floor area", () => {
    const bedroom = { lengthFt: 10, widthFt: 10, heightFt: 10 };
    const summaries = [
      computeRoomAreas(livingRoom, []),
      computeRoomAreas(bedroom, []),
    ];
    const totals = computeProjectAreaTotals(summaries);
    expect(totals.totalFloorArea).toBe(180 + 100);
    expect(totals.largestRoomIndex).toBe(0);
  });

  it("returns null largestRoomIndex for an empty room list", () => {
    expect(computeProjectAreaTotals([]).largestRoomIndex).toBeNull();
  });
});
