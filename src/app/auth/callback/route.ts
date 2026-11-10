import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Handles the redirect from Supabase Auth email links (sign-up confirmation,
 * password reset, magic link). Exchanges the PKCE code for a session, then —
 * for a freshly confirmed sign-up — provisions the user's organization
 * exactly once via the `create_organization_with_owner` RPC (see
 * supabase/migrations; this runs server-side with the user's own session,
 * not the admin client, and is idempotent per user).
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
        const organizationName =
          (data.user.user_metadata?.organization_name as string | undefined) ??
          "My Studio";
        await supabase.rpc("create_organization_with_owner", {
          org_name: organizationName,
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
