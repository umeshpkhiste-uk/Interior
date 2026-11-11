import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

export async function listClients(
  organizationId: string,
  opts: { search?: string; includeArchived?: boolean } = {}
): Promise<ClientRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (!opts.includeArchived) {
    query = query.is("archived_at", null);
  }
  if (opts.search && opts.search.trim().length > 0) {
    query = query.ilike("name", `%${opts.search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getClientById(
  organizationId: string,
  clientId: string
): Promise<ClientRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ClientProjectSummary = {
  id: string;
  name: string;
  status: string;
  carpetArea: number | null;
  updatedAt: string;
};

export async function listProjectsForClient(
  organizationId: string,
  clientId: string
): Promise<ClientProjectSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, status, carpet_area, updated_at")
    .eq("organization_id", organizationId)
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    carpetArea: p.carpet_area,
    updatedAt: p.updated_at,
  }));
}
