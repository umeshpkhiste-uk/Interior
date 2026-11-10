/**
 * Shared primitives for the calculation engine. Every module under
 * lib/calculations/ builds on these so the conventions documented in
 * EXCEL_TO_WEBAPP_MAPPING.md (margin-on-price, Excel-style ROUNDUP, paise-safe
 * currency math) can never drift between modules.
 */

/** Rupees -> integer paise, so all currency math is done on integers. */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Integer paise -> rupees. */
export function fromPaise(paise: number): number {
  return paise / 100;
}

/**
 * Excel's ROUNDUP(value / unit) * unit, operating on paise to stay exact.
 * `unit` is in rupees (e.g. 500, 1000, 5000) per the workbook's per-module
 * rounding conventions (see mapping doc decision #3).
 */
export function roundUpToUnit(rupees: number, unit: number): number {
  if (unit <= 0) return rupees;
  const unitPaise = toPaise(unit);
  const valuePaise = toPaise(rupees);
  const steps = Math.ceil(valuePaise / unitPaise);
  return fromPaise(steps * unitPaise);
}

/**
 * The workbook's pricing convention: margin is applied to the *selling
 * price*, not cost-plus-margin. price = cost / (1 - margin). A margin >= 1
 * degenerates to price = cost (matching the workbook's own guard clause).
 * See mapping doc decision #2 — this must never be approximated as
 * cost * (1 + margin).
 */
export function applyMarginOnPrice(cost: number, marginPct: number): number {
  if (marginPct >= 1) return cost;
  if (marginPct < 0) {
    throw new Error("marginPct must not be negative");
  }
  return cost / (1 - marginPct);
}

/** Cost + margin, then rounded up to the module's configured rounding unit. */
export function priceWithMarginAndRounding(
  cost: number,
  marginPct: number,
  roundingUnit: number
): number {
  const price = applyMarginOnPrice(cost, marginPct);
  return roundUpToUnit(price, roundingUnit);
}

/** Guards against negative quantities / rates anywhere in the engine. */
export function assertNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number, got ${value}`);
  }
}

/**
 * Indian-formatted rupee string, e.g. formatINR(1250000) -> "₹12,50,000".
 * Replaces the inline TEXT/MOD/INT formula repeated in every sheet's "Key
 * Insights" narrative (see docs/EXCEL_ANALYSIS_RAW.md).
 */
export function formatINR(amount: number, options?: { decimals?: boolean }): string {
  const decimals = options?.decimals ?? false;
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const fixed = decimals ? abs.toFixed(2) : Math.round(abs).toString();
  const [wholePart, decimalPart] = fixed.split(".");

  let formatted: string;
  if (wholePart.length <= 3) {
    formatted = wholePart;
  } else {
    const lastThree = wholePart.slice(-3);
    const rest = wholePart.slice(0, -3);
    const restWithCommas = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    formatted = `${restWithCommas},${lastThree}`;
  }

  const sign = isNegative ? "-" : "";
  const decimalSuffix = decimalPart ? `.${decimalPart}` : "";
  return `${sign}₹${formatted}${decimalSuffix}`;
}
