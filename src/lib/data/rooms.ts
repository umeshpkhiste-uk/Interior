import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type RoomRow = Database["public"]["Tables"]["project_rooms"]["Row"];
export type OpeningRow = Database["public"]["Tables"]["room_openings"]["Row"];

export type RoomWithOpenings = RoomRow & { openings: OpeningRow[] };

export async function listRoomsForProject(
  organizationId: string,
  projectId: string
): Promise<RoomWithOpenings[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_rooms")
    .select("*, room_openings(*)")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { room_openings, ...rest } = row as typeof row & { room_openings: OpeningRow[] };
    return { ...rest, openings: room_openings ?? [] };
  });
}

export async function getRoomById(organizationId: string, roomId: string): Promise<RoomWithOpenings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_rooms")
    .select("*, room_openings(*)")
    .eq("organization_id", organizationId)
    .eq("id", roomId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { room_openings, ...rest } = data as typeof data & { room_openings: OpeningRow[] };
  return { ...rest, openings: room_openings ?? [] };
}

export type RoomOption = { id: string; name: string };

export async function listRoomOptions(organizationId: string, projectId: string): Promise<RoomOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_rooms")
    .select("id, room_name")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("room_name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, name: r.room_name }));
}
