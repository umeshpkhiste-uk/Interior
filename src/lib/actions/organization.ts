"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import {
  inviteMemberSchema,
  organizationProfileSchema,
  type InviteMemberInput,
  type OrganizationProfileInput,
} from "@/lib/validations/organization";
import type { Database } from "@/lib/supabase/types";
import type { ActionResult } from "@/lib/actions/clients";

type OrgRole = Database["public"]["Enums"]["org_role"];

export async function updateOrganizationProfile(
  input: OrganizationProfileInput
): Promise<ActionResult> {
  const parsed = organizationProfileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      name: parsed.data.name,
      address: parsed.data.address || null,
      gstin: parsed.data.gstin || null,
      contact_phone: parsed.data.contactPhone || null,
      contact_email: parsed.data.contactEmail || null,
      quotation_prefix: parsed.data.quotationPrefix,
      default_gst_pct: parsed.data.defaultGstPercent / 100,
      default_contingency_pct: parsed.data.defaultContingencyPercent / 100,
    })
    .eq("id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { error: null, data: undefined };
}

export async function inviteMember(input: InviteMemberInput): Promise<ActionResult> {
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  if (ctx.role !== "studio_owner") {
    return { error: "Only the studio owner can invite team members." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: {
      invited_organization_id: ctx.organizationId,
      invited_role: parsed.data.role,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  });

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { error: null, data: undefined };
}

export async function updateMemberRole(memberId: string, role: OrgRole): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  if (ctx.role !== "studio_owner") {
    return { error: "Only the studio owner can change member roles." };
  }

  const supabase = await createClient();
  if (role !== "studio_owner") {
    const { count } = await supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .eq("role", "studio_owner");
    const { data: target } = await supabase
      .from("organization_members")
      .select("role")
      .eq("id", memberId)
      .single();
    if (target?.role === "studio_owner" && (count ?? 0) <= 1) {
      return { error: "An organization must have at least one studio owner." };
    }
  }

  const { error } = await supabase
    .from("organization_members")
    .update({ role })
    .eq("id", memberId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { error: null, data: undefined };
}

export async function removeMember(memberId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  if (ctx.role !== "studio_owner") {
    return { error: "Only the studio owner can remove team members." };
  }

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("organization_members")
    .select("role, user_id")
    .eq("id", memberId)
    .single();

  if (target?.user_id === ctx.userId) {
    return { error: "You can't remove yourself from the organization." };
  }

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { error: null, data: undefined };
}
