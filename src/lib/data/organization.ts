import { cache } from "react";
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
 * re-querying ad hoc. Redirects to /login if unauthenticated.
 *
 * Organization provisioning normally happens in /auth/callback right after
 * email confirmation, but that's not the only way a user can end up
 * authenticated without ever completing that step (e.g. an email
 * provider's security scanner pre-fetching and consuming the one-time
 * confirmation code before the user's own click, then the user simply
 * logging in with email/password afterward). Rather than send a confirmed,
 * authenticated user to a dead-end "confirm your email" page — which the
 * proxy middleware then bounces straight back to /dashboard, an infinite
 * redirect loop — self-heal here by provisioning on the spot. The RPC is
 * idempotent, so this is safe to attempt on every request that needs it.
 *
 * Wrapped in React's cache() because the layout and the page it renders
 * (and sometimes a component further down, e.g. estimators-panel) each call
 * this independently. Without memoization that's 2-3x the auth.getUser()
 * network round trips and DB queries per request for identical results.
 * cache() scopes to a single request/render pass, so this never leaks
 * across users or requests, and Server Actions (separate invocations) are
 * unaffected.
 */
export const requireCurrentUserContext = cache(async (): Promise<CurrentUserContext> => {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/login");
  }

  // Independent of each other (both only need the user id), so run
  // concurrently instead of as two sequential round trips.
  let [
    { data: membership, error: membershipError },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("organization_members")
      .select("organization_id, role, organizations(name)")
      .eq("user_id", userData.user.id)
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", userData.user.id).maybeSingle(),
  ]);

  if (!membershipError && !membership) {
    const { error: provisionError } = await supabase.rpc("create_organization_with_owner", {
      org_name: (userData.user.user_metadata?.organization_name as string | undefined) ?? "My Studio",
    });
    if (!provisionError) {
      ({ data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id, role, organizations(name)")
        .eq("user_id", userData.user.id)
        .limit(1)
        .maybeSingle());
    }
  }

  if (membershipError || !membership) {
    redirect("/verify");
  }

  return {
    userId: userData.user.id,
    email: userData.user.email ?? "",
    fullName: profile?.full_name ?? null,
    organizationId: membership.organization_id,
    organizationName:
      (membership.organizations as { name: string } | null)?.name ?? "Studio",
    role: membership.role,
  };
});

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
