import { z } from "zod";
import { PROPERTY_TYPES } from "./client";

export const PROJECT_STATUSES = [
  "enquiry",
  "site_visit",
  "measurements_pending",
  "design_in_progress",
  "estimation_in_progress",
  "quotation_sent",
  "approved",
  "execution_started",
  "completed",
  "cancelled",
] as const;

export const PROJECT_STATUS_LABELS: Record<(typeof PROJECT_STATUSES)[number], string> = {
  enquiry: "Enquiry",
  site_visit: "Site Visit",
  measurements_pending: "Measurements Pending",
  design_in_progress: "Design in Progress",
  estimation_in_progress: "Estimation in Progress",
  quotation_sent: "Quotation Sent",
  approved: "Approved",
  execution_started: "Execution Started",
  completed: "Completed",
  cancelled: "Cancelled",
};

const optionalNumber = z
  .union([z.number(), z.nan()])
  .optional()
  .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v));

export const projectSchema = z.object({
  clientId: z.string().uuid("Select a client"),
  name: z.string().min(2, "Enter a project name"),
  propertyAddress: z.string().trim().optional().or(z.literal("")),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  bedrooms: optionalNumber.pipe(z.number().int().min(0).optional()),
  bathrooms: optionalNumber.pipe(z.number().int().min(0).optional()),
  carpetArea: optionalNumber.pipe(z.number().min(0).optional()),
  builtUpArea: optionalNumber.pipe(z.number().min(0).optional()),
  startDate: z.string().trim().optional().or(z.literal("")),
  expectedCompletionDate: z.string().trim().optional().or(z.literal("")),
  status: z.enum(PROJECT_STATUSES),
  description: z.string().trim().optional().or(z.literal("")),
  assignedDesignerId: z.string().uuid().optional().or(z.literal("")),
});

export type ProjectInput = z.infer<typeof projectSchema>;
