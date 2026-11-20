"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { updateRoom } from "@/lib/actions/rooms";
import { floorPlanSaveSchema, type FloorPlanSaveInput } from "@/lib/validations/floor-plan";
import type { ActionResult } from "@/lib/actions/clients";

const round2 = (v: number) => Math.round(v * 100) / 100;

export async function saveFloorPlanLayout(projectId: string, input: FloorPlanSaveInput): Promise<ActionResult> {
  const parsed = floorPlanSaveSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid layout" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  // Size changes go through the same path as the Room Measurements form, so areas are recomputed.
  const resized = parsed.data.filter((r) => r.size);
  if (resized.length > 0) {
    const { data: rows, error } = await supabase
      .from("project_rooms")
      .select("id, room_name, room_category, unit_system, height")
      .eq("organization_id", ctx.organizationId)
      .eq("project_id", projectId)
      .in("id", resized.map((r) => r.id));
    if (error) return { error: error.message };

    for (const room of resized) {
      const row = rows.find((r) => r.id === room.id);
      if (!row || !room.size) continue;
      const result = await updateRoom(room.id, projectId, {
        roomName: row.room_name,
        roomCategory: row.room_category,
        unitSystem: row.unit_system,
        length: room.size.length,
        width: room.size.width,
        height: Number(row.height ?? 0),
      });
      if (result.error) return { error: `${row.room_name}: ${result.error}` };
    }
  }

  const results = await Promise.all(
    parsed.data.map((room) =>
      supabase
        .from("project_rooms")
        .update({
          plan_x: round2(room.x),
          plan_y: round2(room.y),
          plan_rotation: room.rotation,
          plan_furniture: room.furniture.map((f) => ({ ...f, x: round2(f.x), y: round2(f.y), w: round2(f.w), h: round2(f.h) })),
        })
        .eq("id", room.id)
        .eq("organization_id", ctx.organizationId)
        .eq("project_id", projectId)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath("/design/2d");
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function resetFloorPlanLayout(projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_rooms")
    .update({ plan_x: null, plan_y: null, plan_rotation: 0, plan_furniture: null })
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId);
  if (error) return { error: error.message };

  revalidatePath("/design/2d");
  return { error: null, data: undefined };
}
