import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectStatus = Database["public"]["Enums"]["project_status"];

export type ProjectListItem = ProjectRow & {
  clientName: string;
  assignedDesignerName: string | null;
};

export async function listProjects(
  organizationId: string,
  opts: { search?: string; status?: ProjectStatus | "all"; includeArchived?: boolean } = {}
): Promise<ProjectListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select("*, clients(name), assigned_designer:assigned_designer_id(full_name)")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (!opts.includeArchived) {
    query = query.is("archived_at", null);
  }
  if (opts.status && opts.status !== "all") {
    query = query.eq("status", opts.status);
  }
  if (opts.search && opts.search.trim().length > 0) {
    query = query.ilike("name", `%${opts.search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const { clients, assigned_designer, ...rest } = row as typeof row & {
      clients: { name: string } | null;
      assigned_designer: { full_name: string | null } | null;
    };
    return {
      ...rest,
      clientName: clients?.name ?? "—",
      assignedDesignerName: assigned_designer?.full_name ?? null,
    };
  });
}

export async function getProjectById(
  organizationId: string,
  projectId: string
): Promise<(ProjectRow & { clientName: string }) | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(name)")
    .eq("organization_id", organizationId)
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { clients, ...rest } = data as typeof data & { clients: { name: string } | null };
  return { ...rest, clientName: clients?.name ?? "—" };
}

export type ClientOption = { id: string; name: string };

export async function listClientOptions(organizationId: string): Promise<ClientOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type DesignerOption = { id: string; label: string };

export async function listDesignerOptions(organizationId: string): Promise<DesignerOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_organization_members", {
    p_org_id: organizationId,
  });
  if (error) throw error;
  return (data ?? [])
    .filter((m) => m.role === "studio_owner" || m.role === "manager" || m.role === "designer")
    .map((m) => ({ id: m.user_id, label: m.full_name ?? m.email ?? "Unnamed" }));
}
