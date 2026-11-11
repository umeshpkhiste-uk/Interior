"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import {
  materialCategorySchema,
  materialSchema,
  supplierSchema,
  type MaterialCategoryInput,
  type MaterialInput,
  type SupplierInput,
} from "@/lib/validations/materials";
import type { ActionResult } from "@/lib/actions/clients";

export async function createMaterialCategory(input: MaterialCategoryInput): Promise<ActionResult> {
  const parsed = materialCategorySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("material_categories").insert({
    organization_id: ctx.organizationId,
    name: parsed.data.name,
    parent_category_id: parsed.data.parentCategoryId || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/materials");
  return { error: null, data: undefined };
}

export async function createMaterial(input: MaterialInput): Promise<ActionResult> {
  const parsed = materialSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("materials").insert({
    organization_id: ctx.organizationId,
    name: parsed.data.name,
    category_id: parsed.data.categoryId || null,
    unit: parsed.data.unit,
    description: parsed.data.description || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/materials");
  return { error: null, data: undefined };
}

export async function setMaterialArchived(materialId: string, archived: boolean): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("materials")
    .update({ archived_at: archived ? new Date().toISOString() : null, is_active: !archived })
    .eq("id", materialId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath("/materials");
  return { error: null, data: undefined };
}

export async function createSupplier(input: SupplierInput): Promise<ActionResult> {
  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("suppliers").insert({
    organization_id: ctx.organizationId,
    name: parsed.data.name,
    contact_phone: parsed.data.contactPhone || null,
    contact_email: parsed.data.contactEmail || null,
    address: parsed.data.address || null,
    notes: parsed.data.notes || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/materials");
  return { error: null, data: undefined };
}
