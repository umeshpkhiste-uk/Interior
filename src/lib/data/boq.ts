import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type BoqItemRow = Database["public"]["Tables"]["boq_items"]["Row"];
export type BoqSettingsRow = Database["public"]["Tables"]["project_boq_settings"]["Row"];

export type BoqItemWithRoom = BoqItemRow & { roomName: string | null };

export async function listBoqItems(organizationId: string, projectId: string): Promise<BoqItemWithRoom[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boq_items")
    .select("*, project_rooms(room_name)")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { project_rooms, ...rest } = row as typeof row & { project_rooms: { room_name: string } | null };
    return { ...rest, roomName: project_rooms?.room_name ?? null };
  });
}

export async function getBoqSettings(organizationId: string, projectId: string): Promise<BoqSettingsRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_boq_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}
