import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Minimal authenticated placeholder proving auth + organization
 * provisioning work end to end. The real dashboard (summary cards, charts,
 * recent projects) is built in Phase 4 against live data — this page is not
 * that, it's a Phase 3 verification point.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organizations(name)")
    .eq("user_id", userData.user?.id ?? "")
    .maybeSingle();

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Signed in</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">Email:</span>{" "}
            {userData.user?.email}
          </p>
          <p>
            <span className="text-muted-foreground">Organization:</span>{" "}
            {(membership as { organizations?: { name?: string } } | null)?.organizations
              ?.name ?? "Not provisioned yet"}
          </p>
          <p>
            <span className="text-muted-foreground">Role:</span>{" "}
            {(membership as { role?: string } | null)?.role ?? "—"}
          </p>
          <form action={signOut} className="mt-4">
            <Button type="submit" variant="outline" className="w-full">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
