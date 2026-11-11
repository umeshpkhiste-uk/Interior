import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Handles the redirect from Supabase Auth email links (sign-up confirmation,
 * password reset, magic link, team invite). Exchanges the PKCE code for a
 * session, then provisions organization membership exactly once:
 *
 * 1. If the user was invited to an existing org (invite_member action set
 *    invited_organization_id/invited_role in their metadata),
 *    accept_organization_invite() adds that membership.
 * 2. Otherwise, for a fresh sign-up, create_organization_with_owner()
 *    provisions a brand-new organization with them as studio_owner.
 *
 * Both RPCs run server-side with the user's own session (never the admin
 * client) and are idempotent per user.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: existingMembership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();

      if (!existingMembership) {
        const { data: invitedOrgId, error: inviteError } = await supabase.rpc(
          "accept_organization_invite"
        );
        if (inviteError) {
          console.error("accept_organization_invite failed", inviteError);
        }

        if (!invitedOrgId) {
          const organizationName =
            (data.user.user_metadata?.organization_name as string | undefined) ??
            "My Studio";
          const { error: provisionError } = await supabase.rpc("create_organization_with_owner", {
            org_name: organizationName,
          });
          if (provisionError) {
            // Not fatal here — requireCurrentUserContext() self-heals and retries
            // this same RPC on the user's next request, so this is just visibility.
            console.error("create_organization_with_owner failed", provisionError);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
