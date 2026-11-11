import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type OrgRole = Database["public"]["Enums"]["org_role"];

export type CurrentUserContext = {
  userId: string;
  email: string;
  fullName: string | null;
  organizationId: string;
  organizationName: string;
  role: OrgRole;
};

/**
 * Resolves the signed-in user's single active organization membership.
 * Every (dashboard) route needs this, so it's centralized here rather than
 * re-querying ad hoc. Redirects to /login if unauthenticated, and to
 * /verify if the user hasn't completed organization provisioning yet
 * (should be rare — the auth callback provisions it immediately on email
 * confirmation).
 */
export async function requireCurrentUserContext(): Promise<CurrentUserContext> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(name)")
    .eq("user_id", userData.user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    redirect("/verify");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userData.user.id)
    .maybeSingle();

  return {
    userId: userData.user.id,
    email: userData.user.email ?? "",
    fullName: profile?.full_name ?? null,
    organizationId: membership.organization_id,
    organizationName:
      (membership.organizations as { name: string } | null)?.name ?? "Studio",
    role: membership.role,
  };
}

export type OrganizationProfile = Database["public"]["Tables"]["organizations"]["Row"];

export async function getOrganizationProfile(organizationId: string): Promise<OrganizationProfile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .single();
  if (error) throw error;
  return data;
}
