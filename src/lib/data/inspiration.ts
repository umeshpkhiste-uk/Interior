import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type MoodboardRow = Database["public"]["Tables"]["moodboards"]["Row"];
export type InspirationImageRow = Database["public"]["Tables"]["inspiration_images"]["Row"];

export type InspirationImageWithUrl = InspirationImageRow & { signedUrl: string | null; roomName: string | null };

export async function listMoodboards(organizationId: string, projectId: string): Promise<MoodboardRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("moodboards")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listInspirationImages(organizationId: string, projectId: string): Promise<InspirationImageWithUrl[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inspiration_images")
    .select("*, project_rooms(room_name)")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  const paths = rows.map((r) => r.image_url);
  const signedUrls = paths.length
    ? (await supabase.storage.from("inspiration").createSignedUrls(paths, 3600)).data ?? []
    : [];
  const urlByPath = new Map(signedUrls.map((s) => [s.path, s.signedUrl]));

  return rows.map((row) => {
    const { project_rooms, ...rest } = row as typeof row & { project_rooms: { room_name: string } | null };
    return { ...rest, signedUrl: urlByPath.get(row.image_url) ?? null, roomName: project_rooms?.room_name ?? null };
  });
}
