import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type MaterialCategoryRow = Database["public"]["Tables"]["material_categories"]["Row"];
export type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
export type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];

export type MaterialWithCategory = MaterialRow & { categoryName: string | null };

export async function listMaterialCategories(organizationId: string): Promise<MaterialCategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("material_categories")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listMaterials(organizationId: string, search?: string): Promise<MaterialWithCategory[]> {
  const supabase = await createClient();
  let query = supabase
    .from("materials")
    .select("*, material_categories(name)")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("name", { ascending: true });
  if (search && search.trim().length > 0) query = query.ilike("name", `%${search.trim()}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { material_categories, ...rest } = row as typeof row & { material_categories: { name: string } | null };
    return { ...rest, categoryName: material_categories?.name ?? null };
  });
}

export async function listSuppliers(organizationId: string): Promise<SupplierRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
