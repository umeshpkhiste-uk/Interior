import Link from "next/link";
import { Briefcase, Search, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { Card, CardContent } from "@/components/ui/card";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const ctx = await requireCurrentUserContext();

  let clients: { id: string; name: string }[] = [];
  let projects: { id: string; name: string; status: string }[] = [];

  if (query.length > 0) {
    const supabase = await createClient();
    const [clientsRes, projectsRes] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name")
        .eq("organization_id", ctx.organizationId)
        .ilike("name", `%${query}%`)
        .limit(20),
      supabase
        .from("projects")
        .select("id, name, status")
        .eq("organization_id", ctx.organizationId)
        .ilike("name", `%${query}%`)
        .limit(20),
    ]);
    clients = clientsRes.data ?? [];
    projects = projectsRes.data ?? [];
  }

  const hasResults = clients.length > 0 || projects.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Search results for &ldquo;{query}&rdquo;
        </h1>
        <p className="text-sm text-muted-foreground">Matching clients and projects.</p>
      </div>

      {query.length === 0 ? (
        <EmptyState icon={Search} message="Type something in the search box above to get started." />
      ) : !hasResults ? (
        <EmptyState icon={Search} message={`No clients or projects matched "${query}".`} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {projects.length > 0 && (
            <Card>
              <CardContent className="flex flex-col gap-2 pt-4">
                <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Briefcase className="size-4" /> Projects
                </h2>
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href="/projects"
                    className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
                  >
                    {p.name}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
          {clients.length > 0 && (
            <Card>
              <CardContent className="flex flex-col gap-2 pt-4">
                <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="size-4" /> Clients
                </h2>
                {clients.map((c) => (
                  <Link
                    key={c.id}
                    href="/clients"
                    className="rounded-md border px-3 py-2 text-sm hover:bg-accent"
                  >
                    {c.name}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: typeof Search;
  message: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <Icon className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
