import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type KitchenEstimationRow = Database["public"]["Tables"]["kitchen_estimations"]["Row"];
export type KitchenAccessoryRow = Database["public"]["Tables"]["kitchen_accessories"]["Row"];

export type KitchenEstimationWithAccessories = KitchenEstimationRow & { accessories: KitchenAccessoryRow[] };

export async function getKitchenEstimation(
  organizationId: string,
  projectId: string
): Promise<KitchenEstimationWithAccessories | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kitchen_estimations")
    .select("*, kitchen_accessories(*)")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { kitchen_accessories, ...rest } = data as typeof data & { kitchen_accessories: KitchenAccessoryRow[] };
  return { ...rest, accessories: kitchen_accessories ?? [] };
}
