/**
 * Client Quotation (Excel sheet 10). See EXCEL_TO_WEBAPP_MAPPING.md sheet
 * 10 section and decisions #9/#10. Contingency % and GST % are passed in
 * explicitly by the caller — for a draft, from the project's live BOQ
 * settings; for a sent quotation, from its immutable snapshot (decision
 * #9), never re-pulled live after sending.
 */
import { assertNonNegative } from "./shared";

export type DiscountType = "percent" | "fixed";

export interface QuotationTotalsInput {
  roomsTotal: number;
  contingencyPct: number;
  extraItemsTotal: number;
  discountType: DiscountType;
  discountValue: number;
  gstPct: number;
}

export interface QuotationTotals {
  roomsTotal: number;
  contingencyAmount: number;
  grossAmount: number;
  discountAmount: number;
  taxableAmount: number;
  gstAmount: number;
  roundOff: number;
  grandTotal: number;
}

export function computeQuotationTotals(input: QuotationTotalsInput): QuotationTotals {
  assertNonNegative(input.roomsTotal, "roomsTotal");
  assertNonNegative(input.extraItemsTotal, "extraItemsTotal");

  const contingencyAmount = input.roomsTotal * input.contingencyPct;
  const grossAmount = input.roomsTotal + contingencyAmount + input.extraItemsTotal;
  const discountAmount =
    input.discountType === "percent" ? grossAmount * input.discountValue : Math.min(input.discountValue, grossAmount);
  const taxableAmount = grossAmount - discountAmount;
  const gstAmount = taxableAmount * input.gstPct;
  const preRound = taxableAmount + gstAmount;
  const grandTotal = Math.round(preRound);
  const roundOff = grandTotal - preRound;

  return { roomsTotal: input.roomsTotal, contingencyAmount, grossAmount, discountAmount, taxableAmount, gstAmount, roundOff, grandTotal };
}

export interface PaymentStageInput {
  stagePct: number;
}

/** Stage amount = GrandTotal × stageShare%. Caller validates stage percentages sum to 100%. */
export function paymentStageAmount(grandTotal: number, stage: PaymentStageInput): number {
  return grandTotal * stage.stagePct;
}

export function paymentStagesSumToFull(stages: PaymentStageInput[]): boolean {
  const total = stages.reduce((sum, s) => sum + s.stagePct, 0);
  return Math.abs(total - 1) < 0.0005;
}
