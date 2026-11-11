import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type ElectricalPointRow = Database["public"]["Tables"]["electrical_estimations"]["Row"];
export type ElectricalProjectSettingsRow = Database["public"]["Tables"]["electrical_project_settings"]["Row"];

export async function listElectricalPointsForProject(
  organizationId: string,
  projectId: string
): Promise<ElectricalPointRow[]> {
  const supabase = await createClient();
  const { data: rooms, error: roomsError } = await supabase
    .from("project_rooms")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId);
  if (roomsError) throw roomsError;
  if (!rooms || rooms.length === 0) return [];

  const { data, error } = await supabase
    .from("electrical_estimations")
    .select("*")
    .eq("organization_id", organizationId)
    .in("room_id", rooms.map((r) => r.id))
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getElectricalProjectSettings(
  organizationId: string,
  projectId: string
): Promise<ElectricalProjectSettingsRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("electrical_project_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}
