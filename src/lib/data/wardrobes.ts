import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type WardrobeRow = Database["public"]["Tables"]["wardrobes"]["Row"];
export type WardrobeComponentRow = Database["public"]["Tables"]["wardrobe_components"]["Row"];

export type WardrobeWithComponents = WardrobeRow & {
  components: WardrobeComponentRow[];
  roomName: string | null;
};

export async function listWardrobes(organizationId: string, projectId: string): Promise<WardrobeWithComponents[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wardrobes")
    .select("*, wardrobe_components(*), project_rooms(room_name)")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { wardrobe_components, project_rooms, ...rest } = row as typeof row & {
      wardrobe_components: WardrobeComponentRow[];
      project_rooms: { room_name: string } | null;
    };
    return { ...rest, components: wardrobe_components ?? [], roomName: project_rooms?.room_name ?? null };
  });
}
