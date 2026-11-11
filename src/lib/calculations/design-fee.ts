/**
 * Design Fee (Excel sheet 11). See EXCEL_TO_WEBAPP_MAPPING.md sheet 11
 * section and decision #12 (project value sourced from the quotation's
 * taxable amount when one exists, else the project's live BOQ subtotal).
 */
import { assertNonNegative } from "./shared";

export type DesignFeeBasis = "percent" | "per_sqft" | "fixed";

export interface DesignFeeInput {
  basis: DesignFeeBasis;
  projectValue: number;
  feePct: number;
  carpetArea: number;
  feePerSqft: number;
  fixedFee: number;
  additionalVisits: number;
  additionalVisitRate: number;
  gstPct: number;
}

export interface DesignFeeBreakdown {
  designFeeAmount: number;
  extraVisitAmount: number;
  totalBeforeGst: number;
  totalWithGst: number;
}

export function computeDesignFee(input: DesignFeeInput): DesignFeeBreakdown {
  assertNonNegative(input.additionalVisits, "additionalVisits");

  const designFeeAmount =
    input.basis === "per_sqft"
      ? input.carpetArea * input.feePerSqft
      : input.basis === "fixed"
        ? input.fixedFee
        : input.projectValue * input.feePct;

  // Extra visits are only ever additive, never a credit (mapping doc sheet 11).
  const extraVisitAmount = input.additionalVisits * input.additionalVisitRate;
  const totalBeforeGst = designFeeAmount + extraVisitAmount;
  const totalWithGst = totalBeforeGst * (1 + input.gstPct);

  return { designFeeAmount, extraVisitAmount, totalBeforeGst, totalWithGst };
}
