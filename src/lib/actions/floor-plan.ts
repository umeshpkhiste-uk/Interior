"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { createOpening, createRoom, deleteOpening, updateOpening, updateRoom } from "@/lib/actions/rooms";
import { z } from "zod";
import {
  FLOOR_MATERIALS,
  type FloorMaterial,
  floorPlanSaveSchema,
  newAreaSchema,
  newOpeningSchema,
  roomFinishSchema,
  type FloorPlanSaveInput,
  type RoomFinishInput,
  type NewAreaInput,
  type NewOpeningInput,
} from "@/lib/validations/floor-plan";
import type { ActionResult } from "@/lib/actions/clients";

const round2 = (v: number) => Math.round(v * 100) / 100;

export async function saveFloorPlanLayout(projectId: string, input: FloorPlanSaveInput): Promise<ActionResult> {
  const parsed = floorPlanSaveSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid layout" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();

  // Size changes go through the same path as the Room Measurements form, so areas are recomputed.
  const { rooms, passage, openings, removedOpenings } = parsed.data;
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
          plan_wall_gaps: room.wallGaps.map((g) => ({ wall: g.wall, from: round2(g.from), to: round2(g.to) })),
          plan_furniture: room.furniture.map((f) => ({ ...f, x: round2(f.x), y: round2(f.y), w: round2(f.w), h: round2(f.h) })),
        })
        .eq("id", room.id)
        .eq("organization_id", ctx.organizationId)
        .eq("project_id", projectId)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  const removedIds = new Set(removedOpenings.map((o) => o.id));
  const openingError = await saveOpeningPlacements(
    ctx.organizationId,
    projectId,
    openings.filter((o) => !removedIds.has(o.id))
  );
  if (openingError) return { error: openingError };

  // Doors/windows on removed wall pieces go with the wall (and off Room Measurements). A
  // Room Measurements row with quantity > 1 only loses the copies that were removed.
  const removedCount = new Map<string, { roomId: string; count: number }>();
  for (const o of removedOpenings) {
    const entry = removedCount.get(o.id) ?? { roomId: o.roomId, count: 0 };
    entry.count++;
    removedCount.set(o.id, entry);
  }
  if (removedCount.size > 0) {
    const { data: rows, error } = await supabase
      .from("room_openings")
      .select("id, opening_type, width, height, quantity")
      .eq("organization_id", ctx.organizationId)
      .in("id", [...removedCount.keys()]);
    if (error) return { error: error.message };
    for (const row of rows) {
      const { roomId, count } = removedCount.get(row.id)!;
      const result =
        count >= row.quantity
          ? await deleteOpening(row.id, roomId, projectId)
          : await updateOpening(row.id, roomId, projectId, {
              openingType: row.opening_type,
              width: Number(row.width ?? 0),
              height: Number(row.height ?? 0),
              quantity: row.quantity - count,
            });
      if (result.error) return { error: result.error };
    }
  }

  revalidatePath("/design/2d");
  revalidatePath(`/projects/${projectId}`);
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

async function saveOpeningPlacements(
  organizationId: string,
  projectId: string,
  openings: FloorPlanSaveInput["openings"]
): Promise<string | null> {
  if (openings.length === 0) return null;
  const supabase = await createClient();
  const projectRoomIds = new Set(
    (
      await supabase.from("project_rooms").select("id").eq("organization_id", organizationId).eq("project_id", projectId)
    ).data?.map((r) => r.id) ?? []
  );

  for (const o of openings) {
    if (!projectRoomIds.has(o.roomId)) return "Opening does not belong to this project";
    const { data: row, error } = await supabase
      .from("room_openings")
      .update({
        plan_wall: o.wall,
        plan_offset: round2(o.offset),
        plan_swing: o.swing,
        plan_full_height: o.fullHeight,
        plan_main_door: o.mainDoor,
      })
      .eq("id", o.id)
      .eq("room_id", o.roomId)
      .eq("organization_id", organizationId)
      .select("opening_type, height, quantity")
      .single();
    if (error) return error.message;
    if (o.widthFt !== undefined) {
      // Width changes the wall area, so it goes through the same update as Room Measurements.
      const result = await updateOpening(o.id, o.roomId, projectId, {
        openingType: row.opening_type,
        width: o.widthFt,
        height: Number(row.height ?? 0),
        quantity: row.quantity,
      });
      if (result.error) return result.error;
    }
  }
  return null;
}

/** Adds a door/window to a room from the plan, already placed on the chosen wall. */
export async function addFloorPlanOpening(projectId: string, input: NewOpeningInput): Promise<ActionResult<{ id: string }>> {
  const parsed = newOpeningSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid opening" };
  const o = parsed.data;

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data: room, error: roomError } = await supabase
    .from("project_rooms")
    .select("id")
    .eq("id", o.roomId)
    .eq("project_id", projectId)
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();
  if (roomError) return { error: roomError.message };
  if (!room) return { error: "Room not found" };

  const created = await createOpening(o.roomId, projectId, {
    openingType: o.type,
    width: o.widthFt,
    height: o.heightFt,
    quantity: 1,
  });
  if (created.error !== null) return { error: created.error };

  const { error } = await supabase
    .from("room_openings")
    .update({ plan_wall: o.wall, plan_offset: round2(o.offset), plan_full_height: o.type === "window" && Boolean(o.fullHeight) })
    .eq("id", created.data.id)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };

  revalidatePath("/design/2d");
  return { error: null, data: { id: created.data.id } };
}

/** Sets the floor finish of the whole house (null = the default tiles). */
export async function saveHouseFloor(projectId: string, floorMaterial: FloorMaterial | null): Promise<ActionResult> {
  const parsed = z.enum(FLOOR_MATERIALS).nullable().safeParse(floorMaterial);
  if (!parsed.success) return { error: "Invalid floor" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ plan_floor_material: parsed.data })
    .eq("id", projectId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };

  revalidatePath("/design/2d");
  revalidatePath("/design/3d");
  return { error: null, data: undefined };
}

/** Saves a room's wall paint and floor material (null = back to the default). */
export async function saveRoomFinish(projectId: string, input: RoomFinishInput): Promise<ActionResult> {
  const parsed = roomFinishSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid finish" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_rooms")
    .update({ plan_wall_color: parsed.data.wallColor, plan_wall_designs: parsed.data.wallDesigns })
    .eq("id", parsed.data.roomId)
    .eq("project_id", projectId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };

  revalidatePath("/design/2d");
  revalidatePath("/design/3d");
  return { error: null, data: undefined };
}
