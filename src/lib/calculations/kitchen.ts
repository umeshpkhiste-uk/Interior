/**
 * Modular Kitchen (Excel sheet 02). See EXCEL_TO_WEBAPP_MAPPING.md sheet 02
 * section. Margin-on-price convention: price = cost/(1-margin), rounded UP
 * to the nearest rounding unit (default ₹1,000) — see shared.ts.
 */
import { assertNonNegative, priceWithMarginAndRounding } from "./shared";

export type KitchenLayoutType = "straight" | "l_shaped" | "u_shaped" | "parallel" | "island";

/** CornerUnits = IF(layout="u_shaped",2, IF(layout IN ("l_shaped","island"),1, 0)). */
export function autoCornerQty(layout: KitchenLayoutType): number {
  if (layout === "u_shaped") return 2;
  if (layout === "l_shaped" || layout === "island") return 1;
  return 0;
}

export interface KitchenCostInput {
  baseRft: number;
  wallRft: number;
  tallQty: number;
  cornerQty: number;
  baseRate: number;
  wallRate: number;
  tallRate: number;
  cornerRate: number;
  countertopArea: number;
  countertopRate: number;
  /** Sum of qty×rate across the kitchen_accessories (hardware) rows. */
  accessoriesTotal: number;
  /** Phase 6 addition (mapping doc §): applied to area-based cabinet + countertop cost only. */
  wastagePct: number;
  installLabourPct: number;
}

export interface KitchenCostBreakdown {
  cabinets: number;
  countertop: number;
  hardware: number;
  material: number;
  labour: number;
  cost: number;
}

export function kitchenCost(input: KitchenCostInput): KitchenCostBreakdown {
  assertNonNegative(input.baseRft, "baseRft");
  assertNonNegative(input.wallRft, "wallRft");

  const cabinets =
    input.baseRft * input.baseRate +
    input.wallRft * input.wallRate +
    input.tallQty * input.tallRate +
    input.cornerQty * input.cornerRate;
  const countertop = input.countertopArea * input.countertopRate;
  const hardware = input.accessoriesTotal;
  const material = (cabinets + countertop) * (1 + input.wastagePct) + hardware;
  const labour = material * input.installLabourPct;

  return { cabinets, countertop, hardware, material, labour, cost: material + labour };
}

export function kitchenPrice(cost: number, marginPct: number, roundingUnit: number): number {
  return priceWithMarginAndRounding(cost, marginPct, roundingUnit);
}
