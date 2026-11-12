import { requireCurrentUserContext } from "@/lib/data/organization";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status")
    .eq("organization_id", ctx.organizationId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar
        organizationName={ctx.organizationName}
        fullName={ctx.fullName}
        email={ctx.email}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar
          fullName={ctx.fullName}
          email={ctx.email}
          role={ctx.role}
          organizationName={ctx.organizationName}
          projects={projects ?? []}
        />
        <main className="flex-1 bg-muted/30 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
