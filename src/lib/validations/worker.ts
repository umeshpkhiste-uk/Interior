import { z } from "zod";

export const LABOUR_TRADES = [
  "carpenter",
  "helper",
  "painter",
  "electrician",
  "ceiling_worker",
  "polish_worker",
  "tile_mason",
  "other",
] as const;

export const LABOUR_TRADE_LABELS: Record<(typeof LABOUR_TRADES)[number], string> = {
  carpenter: "Carpenter",
  helper: "Helper",
  painter: "Painter",
  electrician: "Electrician",
  ceiling_worker: "Ceiling worker",
  polish_worker: "Polish worker",
  tile_mason: "Tile mason",
  other: "Other",
};

export const workerSchema = z.object({
  name: z.string().min(1, "Enter the worker's name"),
  trade: z.enum(LABOUR_TRADES),
  dailyWage: z
    .union([z.number(), z.nan()])
    .transform((v) => (Number.isNaN(v) ? -1 : v))
    .pipe(z.number().min(0, "Enter the daily wage")),
  phone: z.string().optional().or(z.literal("")),
  team: z.string().optional().or(z.literal("")),
});

export type WorkerInput = z.infer<typeof workerSchema>;
