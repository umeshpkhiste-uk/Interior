/**
 * Room Area & Walls (Excel sheet 01). Formulas preserved exactly:
 * Floor = L×W; Perimeter = 2(L+W); GrossWall = Perimeter×H;
 * Openings = Σ(qty×width×height) per opening; NetWall = MAX(0, GrossWall−Openings);
 * Ceiling = Floor. See EXCEL_TO_WEBAPP_MAPPING.md sheet 01 section.
 */
import { assertNonNegative } from "./shared";

const METERS_TO_FEET = 3.28084;

/** Both feet_inches and metric inputs are standardized to decimal feet for calculation. */
export function toStandardFeet(value: number, unitSystem: "feet_inches" | "metric"): number {
  assertNonNegative(value, "value");
  return unitSystem === "metric" ? value * METERS_TO_FEET : value;
}

export interface RoomDimensionsFt {
  lengthFt: number;
  widthFt: number;
  heightFt: number;
}

export interface OpeningInputFt {
  widthFt: number;
  heightFt: number;
  quantity: number;
}

export function floorArea(dims: RoomDimensionsFt): number {
  return dims.lengthFt * dims.widthFt;
}

export function perimeter(dims: RoomDimensionsFt): number {
  return 2 * (dims.lengthFt + dims.widthFt);
}

export function grossWallArea(dims: RoomDimensionsFt): number {
  return perimeter(dims) * dims.heightFt;
}

export function totalOpeningArea(openings: OpeningInputFt[]): number {
  return openings.reduce((sum, o) => sum + o.quantity * o.widthFt * o.heightFt, 0);
}

export function netWallArea(gross: number, openingsArea: number): number {
  return Math.max(0, gross - openingsArea);
}

export function ceilingArea(dims: RoomDimensionsFt): number {
  return floorArea(dims);
}

export interface RoomAreaSummary {
  floorArea: number;
  perimeter: number;
  grossWallArea: number;
  openingArea: number;
  netWallArea: number;
  ceilingArea: number;
}

export function computeRoomAreas(dims: RoomDimensionsFt, openings: OpeningInputFt[]): RoomAreaSummary {
  const floor = floorArea(dims);
  const gross = grossWallArea(dims);
  const openingArea = totalOpeningArea(openings);
  return {
    floorArea: floor,
    perimeter: perimeter(dims),
    grossWallArea: gross,
    openingArea,
    netWallArea: netWallArea(gross, openingArea),
    ceilingArea: floor,
  };
}

export interface ProjectAreaTotals {
  totalFloorArea: number;
  totalNetWallArea: number;
  totalCeilingArea: number;
  largestRoomIndex: number | null;
}

/** Project-wide totals + the largest room by floor area (INDEX/MATCH on max in the source sheet). */
export function computeProjectAreaTotals(rooms: RoomAreaSummary[]): ProjectAreaTotals {
  let largestRoomIndex: number | null = null;
  let largestArea = -Infinity;
  rooms.forEach((room, index) => {
    if (room.floorArea > largestArea) {
      largestArea = room.floorArea;
      largestRoomIndex = index;
    }
  });
  return {
    totalFloorArea: rooms.reduce((sum, r) => sum + r.floorArea, 0),
    totalNetWallArea: rooms.reduce((sum, r) => sum + r.netWallArea, 0),
    totalCeilingArea: rooms.reduce((sum, r) => sum + r.ceilingArea, 0),
    largestRoomIndex: rooms.length > 0 ? largestRoomIndex : null,
  };
}
