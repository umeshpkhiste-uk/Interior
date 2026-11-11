import { z } from "zod";

export const organizationProfileSchema = z.object({
  name: z.string().min(2, "Enter the studio name"),
  address: z.string().trim().optional().or(z.literal("")),
  gstin: z.string().trim().optional().or(z.literal("")),
  contactPhone: z.string().trim().optional().or(z.literal("")),
  contactEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  quotationPrefix: z.string().trim().min(1, "Required").max(10),
  /** Entered and displayed as a plain percentage (e.g. 18 for 18%), stored
   *  in the DB as a fraction (0.1800) — converted at the action boundary.
   *  Plain z.number() (not z.coerce) so the form's input/output types
   *  match exactly; the <input type="number"> uses valueAsNumber instead. */
  defaultGstPercent: z.number().min(0).max(100),
  defaultContingencyPercent: z.number().min(0).max(100),
});
export type OrganizationProfileInput = z.infer<typeof organizationProfileSchema>;

export const INVITABLE_ROLES = ["manager", "designer", "accountant", "viewer"] as const;

export const inviteMemberSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(INVITABLE_ROLES),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
