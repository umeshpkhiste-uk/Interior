"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { clientSchema, type ClientInput } from "@/lib/validations/client";

export type ActionResult<T = undefined> = { error: string; data?: undefined } | { error: null; data: T };

function toRow(input: ClientInput) {
  return {
    name: input.name,
    mobile: input.mobile || null,
    email: input.email || null,
    alternate_contact: input.alternateContact || null,
    address: input.address || null,
    city: input.city || null,
    state: input.state || null,
    pin_code: input.pinCode || null,
    property_type: input.propertyType || null,
    notes: input.notes || null,
  };
}

export async function createClientRecord(input: ClientInput): Promise<ActionResult<{ id: string }>> {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ organization_id: ctx.organizationId, ...toRow(parsed.data) })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/clients");
  return { error: null, data: { id: data.id } };
}

export async function updateClientRecord(
  clientId: string,
  input: ClientInput
): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update(toRow(parsed.data))
    .eq("id", clientId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { error: null, data: undefined };
}

export async function setClientArchived(clientId: string, archived: boolean): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", clientId)
    .eq("organization_id", ctx.organizationId);

  if (error) return { error: error.message };
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { error: null, data: undefined };
}
