/**
 * Validated categorical palette for dashboard charts (light mode only — the
 * app ships no dark-mode toggle, matching the master prompt's light,
 * warm-off-white visual direction). Run against the dataviz skill's
 * validator before changing any of these:
 *   node validate_palette.js "#2566A3,#C25A17,#2E8B57,#8B3A62" --mode light
 * All adjacent-pair and normal-vision checks pass; do not reorder casually
 * — order is part of what makes the adjacent pairs pass.
 */
export const CHART_COLORS = {
  blue: "#2566A3",
  bronze: "#C25A17",
  green: "#2E8B57",
  plum: "#8B3A62",
} as const;

export const CATEGORICAL_SEQUENCE = [
  CHART_COLORS.blue,
  CHART_COLORS.bronze,
  CHART_COLORS.green,
  CHART_COLORS.plum,
];

/** Reserved for positive/negative status — never reused as a 3rd categorical series. */
export const STATUS_COLORS = {
  positive: "#1E7B45",
  negative: "#B23A3A",
};

export const CHART_GRID_COLOR = "oklch(0.88 0.012 70)";
export const CHART_AXIS_TEXT_COLOR = "oklch(0.5 0.015 60)";
