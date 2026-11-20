"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { createRoom, updateRoom } from "@/lib/actions/rooms";
import { floorPlanSaveSchema, newAreaSchema, type FloorPlanSaveInput, type NewAreaInput } from "@/lib/validations/floor-plan";
import type { ActionResult } from "@/lib/actions/clients";

const round2 = (v: number) => Math.round(v * 100) / 100;

export async function saveFloorPlanLayout(projectId: string, input: FloorPlanSaveInput): Promise<ActionResult> {
  const parsed = floorPlanSaveSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid layout" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  // Size changes go through the same path as the Room Measurements form, so areas are recomputed.
  const { rooms, passage } = parsed.data;
  const resized = rooms.filter((r) => r.size);
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

  const { error: passageError } = await supabase
    .from("projects")
    .update({ plan_passage: passage })
    .eq("id", projectId)
    .eq("organization_id", ctx.organizationId);
  if (passageError) return { error: passageError.message };

  const results = await Promise.all(
    rooms.map((room) =>
      supabase
        .from("project_rooms")
        .update({
          plan_x: round2(room.x),
          plan_y: round2(room.y),
          plan_rotation: room.rotation,
          plan_open_walls: room.openWalls,
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
    .update({ plan_x: null, plan_y: null, plan_rotation: 0, plan_furniture: null, plan_open_walls: [] })
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId);
  if (error) return { error: error.message };

  revalidatePath("/design/2d");
  return { error: null, data: undefined };
}

/**
 * Adds a space (passage, WC, balcony…) straight from the plan. It is a normal room,
 * so it also appears on Room Measurements; passages start with no walls.
 */
export async function addFloorPlanArea(projectId: string, input: NewAreaInput): Promise<ActionResult<{ id: string }>> {
  const parsed = newAreaSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid area" };
  const area = parsed.data;

  const created = await createRoom(projectId, {
    roomName: area.name,
    roomCategory: area.category,
    unitSystem: "feet_inches",
    length: area.lengthFt,
    width: area.widthFt,
    height: 10,
  });
  if (created.error !== null) return { error: created.error };
  const roomId = created.data.id;

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_rooms")
    .update({
      plan_x: round2(area.x),
      plan_y: round2(area.y),
      plan_open_walls: area.category === "passage" ? ["top", "right", "bottom", "left"] : [],
    })
    .eq("id", roomId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };

  revalidatePath("/design/2d");
  return { error: null, data: { id: roomId } };
}
