import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Server-side Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Reads/writes the session via Next.js's async cookies()
 * API (required since Next 15+ — never access cookies() synchronously).
 *
 * Uses the publishable key; RLS enforces per-organization access based on
 * the authenticated user's session, exactly like the browser client.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component where cookies can't be set.
            // The proxy (middleware) refreshes the session on every request,
            // so this is safe to ignore here.
          }
        },
      },
    }
  );
}

/**
 * Admin client using the secret (service-role-equivalent) key. Bypasses RLS
 * entirely — only use inside trusted server-only code (Route Handlers /
 * Server Actions) for operations that must cross organization boundaries
 * (e.g. provisioning a new organization). Never import this from a module
 * that could end up in a Client Component bundle.
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Admin client is never used to manage a user session.
        },
      },
    }
  );
}
