"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { roomSchema, openingSchema, type RoomInput, type OpeningInput } from "@/lib/validations/room";
import { computeRoomAreas, toStandardFeet } from "@/lib/calculations/area";
import type { ActionResult } from "@/lib/actions/clients";

/** Recomputes and persists a room's area fields from its current dimensions + openings. */
async function recomputeRoomAreas(roomId: string) {
  const supabase = await createClient();
  const { data: room, error: roomError } = await supabase
    .from("project_rooms")
    .select("length_ft, width_ft, height_ft")
    .eq("id", roomId)
    .single();
  if (roomError) throw roomError;

  const { data: openings, error: openingsError } = await supabase
    .from("room_openings")
    .select("width, height, quantity")
    .eq("room_id", roomId);
  if (openingsError) throw openingsError;

  const dims = { lengthFt: Number(room.length_ft ?? 0), widthFt: Number(room.width_ft ?? 0), heightFt: Number(room.height_ft ?? 0) };
  const areas = computeRoomAreas(
    dims,
    (openings ?? []).map((o) => ({
      widthFt: Number(o.width ?? 0),
      heightFt: Number(o.height ?? 0),
      quantity: o.quantity,
    }))
  );

  const { error: updateError } = await supabase
    .from("project_rooms")
    .update({
      floor_area: areas.floorArea,
      gross_wall_area: areas.grossWallArea,
      net_wall_area: areas.netWallArea,
      ceiling_area: areas.ceilingArea,
    })
    .eq("id", roomId);
  if (updateError) throw updateError;
}

export async function createRoom(projectId: string, input: RoomInput): Promise<ActionResult<{ id: string }>> {
  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const lengthFt = toStandardFeet(parsed.data.length, parsed.data.unitSystem);
  const widthFt = toStandardFeet(parsed.data.width, parsed.data.unitSystem);
  const heightFt = toStandardFeet(parsed.data.height, parsed.data.unitSystem);

  const { data, error } = await supabase
    .from("project_rooms")
    .insert({
      organization_id: ctx.organizationId,
      project_id: projectId,
      room_name: parsed.data.roomName,
      room_category: parsed.data.roomCategory,
      unit_system: parsed.data.unitSystem,
      length: parsed.data.length,
      width: parsed.data.width,
      height: parsed.data.height,
      length_ft: lengthFt,
      width_ft: widthFt,
      height_ft: heightFt,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await recomputeRoomAreas(data.id);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: { id: data.id } };
}

export async function updateRoom(roomId: string, projectId: string, input: RoomInput): Promise<ActionResult> {
  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const lengthFt = toStandardFeet(parsed.data.length, parsed.data.unitSystem);
  const widthFt = toStandardFeet(parsed.data.width, parsed.data.unitSystem);
  const heightFt = toStandardFeet(parsed.data.height, parsed.data.unitSystem);

  const { error } = await supabase
    .from("project_rooms")
    .update({
      room_name: parsed.data.roomName,
      room_category: parsed.data.roomCategory,
      unit_system: parsed.data.unitSystem,
      length: parsed.data.length,
      width: parsed.data.width,
      height: parsed.data.height,
      length_ft: lengthFt,
      width_ft: widthFt,
      height_ft: heightFt,
    })
    .eq("id", roomId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };

  await recomputeRoomAreas(roomId);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function deleteRoom(roomId: string, projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_rooms")
    .delete()
    .eq("id", roomId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function createOpening(
  roomId: string,
  projectId: string,
  input: OpeningInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = openingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("room_openings")
    .insert({
      organization_id: ctx.organizationId,
      room_id: roomId,
      opening_type: parsed.data.openingType,
      width: parsed.data.width,
      height: parsed.data.height,
      quantity: parsed.data.quantity,
      is_custom: true,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await recomputeRoomAreas(roomId);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: { id: data.id } };
}

export async function deleteOpening(openingId: string, roomId: string, projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("room_openings")
    .delete()
    .eq("id", openingId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };

  await recomputeRoomAreas(roomId);
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}
