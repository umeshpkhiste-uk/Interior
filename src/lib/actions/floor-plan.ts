"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import type { ActionResult } from "@/lib/actions/clients";

const layoutSchema = z
  .array(
    z.object({
      id: z.string().uuid(),
      x: z.number().finite(),
      y: z.number().finite(),
      rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
    })
  )
  .max(200);

export type FloorPlanPositionInput = z.infer<typeof layoutSchema>;

export async function saveFloorPlanLayout(
  projectId: string,
  input: FloorPlanPositionInput
): Promise<ActionResult> {
  const parsed = layoutSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid layout" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const results = await Promise.all(
    parsed.data.map((room) =>
      supabase
        .from("project_rooms")
        .update({
          plan_x: Math.round(room.x * 100) / 100,
          plan_y: Math.round(room.y * 100) / 100,
          plan_rotation: room.rotation,
        })
        .eq("id", room.id)
        .eq("organization_id", ctx.organizationId)
        .eq("project_id", projectId)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath("/design/2d");
  return { error: null, data: undefined };
}

export async function resetFloorPlanLayout(projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_rooms")
    .update({ plan_x: null, plan_y: null, plan_rotation: 0 })
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId);
  if (error) return { error: error.message };

  revalidatePath("/design/2d");
  return { error: null, data: undefined };
}
