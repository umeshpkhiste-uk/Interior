"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import {
  moodboardSchema,
  inspirationImageMetaSchema,
  type MoodboardInput,
  type InspirationImageMetaInput,
} from "@/lib/validations/inspiration";
import type { ActionResult } from "@/lib/actions/clients";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function createMoodboard(projectId: string, input: MoodboardInput): Promise<ActionResult> {
  const parsed = moodboardSchema.safeParse(input);
  if (parsed.error) return { error: parsed.error.issues[0].message };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("moodboards").insert({
    project_id: projectId,
    organization_id: ctx.organizationId,
    name: parsed.data.name,
    description: parsed.data.description || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function deleteMoodboard(projectId: string, moodboardId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("moodboards")
    .delete()
    .eq("id", moodboardId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function uploadInspirationImage(
  projectId: string,
  file: File,
  meta: InspirationImageMetaInput
): Promise<ActionResult> {
  const parsed = inspirationImageMetaSchema.safeParse(meta);
  if (parsed.error) return { error: parsed.error.issues[0].message };

  if (!ALLOWED_TYPES.has(file.type)) return { error: "Only JPEG, PNG, or WEBP images are supported." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Image must be 10 MB or smaller." };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${ctx.organizationId}/${projectId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("inspiration").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from("inspiration_images").insert({
    project_id: projectId,
    organization_id: ctx.organizationId,
    room_id: parsed.data.roomId || null,
    moodboard_id: parsed.data.moodboardId || null,
    category: parsed.data.category,
    image_url: path,
    notes: parsed.data.notes || null,
    material_specification: parsed.data.materialSpecification || null,
    uploaded_by: ctx.userId,
  });
  if (insertError) {
    await supabase.storage.from("inspiration").remove([path]);
    return { error: insertError.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function updateInspirationImage(
  projectId: string,
  imageId: string,
  meta: InspirationImageMetaInput
): Promise<ActionResult> {
  const parsed = inspirationImageMetaSchema.safeParse(meta);
  if (parsed.error) return { error: parsed.error.issues[0].message };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("inspiration_images")
    .update({
      category: parsed.data.category,
      room_id: parsed.data.roomId || null,
      moodboard_id: parsed.data.moodboardId || null,
      notes: parsed.data.notes || null,
      material_specification: parsed.data.materialSpecification || null,
    })
    .eq("id", imageId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function deleteInspirationImage(projectId: string, imageId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  const { data: image, error: fetchError } = await supabase
    .from("inspiration_images")
    .select("image_url")
    .eq("id", imageId)
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();
  if (fetchError) return { error: fetchError.message };
  if (!image) return { error: "Image not found" };

  const { error: deleteError } = await supabase
    .from("inspiration_images")
    .delete()
    .eq("id", imageId)
    .eq("organization_id", ctx.organizationId);
  if (deleteError) return { error: deleteError.message };

  await supabase.storage.from("inspiration").remove([image.image_url]);

  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}
