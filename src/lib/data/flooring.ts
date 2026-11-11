import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type FlooringEstimationRow = Database["public"]["Tables"]["flooring_estimations"]["Row"];

export async function listFlooringEstimationsForProject(
  organizationId: string,
  projectId: string
): Promise<FlooringEstimationRow[]> {
  const supabase = await createClient();
  const { data: rooms, error: roomsError } = await supabase
    .from("project_rooms")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId);
  if (roomsError) throw roomsError;
  if (!rooms || rooms.length === 0) return [];

  const { data, error } = await supabase
    .from("flooring_estimations")
    .select("*")
    .eq("organization_id", organizationId)
    .in("room_id", rooms.map((r) => r.id));
  if (error) throw error;
  return data ?? [];
}
