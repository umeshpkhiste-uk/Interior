/**
 * Full Home BOQ (Excel sheet 09). See EXCEL_TO_WEBAPP_MAPPING.md sheet 09
 * section. Both contingency % and GST % are per-project editable inputs,
 * never hardcoded.
 */
import { assertNonNegative } from "./shared";

export interface BoqLineAmount {
  amount: number;
}

export function boqSubtotal(items: BoqLineAmount[]): number {
  return items.reduce((sum, i) => sum + i.amount, 0);
}

export interface BoqTotals {
  subtotal: number;
  contingency: number;
  beforeGst: number;
  gst: number;
  grandTotal: number;
  perSqft: number | null;
}

/**
 * Contingency = Total×%; BeforeGST = Total+Contingency; GST = BeforeGST×%;
 * GrandTotal = BeforeGST+GST; PerSqFt = BeforeGST/CarpetArea (before GST).
 */
export function computeBoqTotals(
  items: BoqLineAmount[],
  contingencyPct: number,
  gstPct: number,
  carpetArea: number | null
): BoqTotals {
  const subtotal = boqSubtotal(items);
  assertNonNegative(subtotal, "subtotal");
  const contingency = subtotal * contingencyPct;
  const beforeGst = subtotal + contingency;
  const gst = beforeGst * gstPct;
  const grandTotal = beforeGst + gst;
  const perSqft = carpetArea && carpetArea > 0 ? beforeGst / carpetArea : null;
  return { subtotal, contingency, beforeGst, gst, grandTotal, perSqft };
}
