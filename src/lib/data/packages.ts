import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type PackageRow = Database["public"]["Tables"]["project_packages"]["Row"];
export type PackageComponentRow = Database["public"]["Tables"]["package_components"]["Row"];

export type PackageWithComponents = PackageRow & { components: PackageComponentRow[] };

export async function listPackages(organizationId: string, projectId: string): Promise<PackageWithComponents[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_packages")
    .select("*, package_components(*)")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("tier", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { package_components, ...rest } = row as typeof row & { package_components: PackageComponentRow[] };
    return { ...rest, components: package_components ?? [] };
  });
}
