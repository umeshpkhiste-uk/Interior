import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type CeilingEstimationRow = Database["public"]["Tables"]["ceiling_estimations"]["Row"];

export type CeilingEstimationForRoom = CeilingEstimationRow & { roomName: string; floorArea: number };

export async function listCeilingEstimationsForProject(
  organizationId: string,
  projectId: string
): Promise<CeilingEstimationForRoom[]> {
  const supabase = await createClient();
  const { data: rooms, error: roomsError } = await supabase
    .from("project_rooms")
    .select("id, room_name, floor_area")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId);
  if (roomsError) throw roomsError;
  if (!rooms || rooms.length === 0) return [];

  const { data: estimations, error } = await supabase
    .from("ceiling_estimations")
    .select("*")
    .eq("organization_id", organizationId)
    .in("room_id", rooms.map((r) => r.id));
  if (error) throw error;

  const roomById = new Map(rooms.map((r) => [r.id, r]));
  return (estimations ?? []).map((e) => {
    const room = roomById.get(e.room_id);
    return { ...e, roomName: room?.room_name ?? "—", floorArea: Number(room?.floor_area ?? 0) };
  });
}
