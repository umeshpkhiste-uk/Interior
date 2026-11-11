"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { createQuotationDraft, addQuotationItem } from "@/lib/actions/quotations";
import { packageComponentSchema, packageSettingsSchema, PACKAGE_TIERS, PACKAGE_TIER_LABELS, type PackageComponentInput, type PackageSettingsInput } from "@/lib/validations/packages";
import type { ActionResult } from "@/lib/actions/clients";
import type { Database } from "@/lib/supabase/types";

type PackageTier = Database["public"]["Enums"]["package_tier"];

/** Ensures all 3 tiers exist for a project so the compare view always has something to render. */
export async function ensurePackagesExist(organizationId: string, projectId: string): Promise<ActionResult> {
  const supabase = await createClient();
  for (const tier of PACKAGE_TIERS) {
    const { data: existing } = await supabase
      .from("project_packages")
      .select("id")
      .eq("project_id", projectId)
      .eq("tier", tier)
      .maybeSingle();
    if (!existing) {
      const { error } = await supabase.from("project_packages").insert({ organization_id: organizationId, project_id: projectId, tier });
      if (error) return { error: error.message };
    }
  }
  return { error: null, data: undefined };
}

export async function savePackageComponent(
  packageId: string,
  projectId: string,
  input: PackageComponentInput,
  componentId?: string
): Promise<ActionResult> {
  const parsed = packageComponentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const row = {
    component: parsed.data.component,
    rate_per_sqft: parsed.data.ratePerSqft,
    spec_text: parsed.data.specText || null,
    brand_options: parsed.data.brandOptions || null,
  };

  const { error } = componentId
    ? await supabase.from("package_components").update(row).eq("id", componentId).eq("organization_id", ctx.organizationId)
    : await supabase.from("package_components").insert({ organization_id: ctx.organizationId, package_id: packageId, ...row });
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function deletePackageComponent(componentId: string, projectId: string): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase.from("package_components").delete().eq("id", componentId).eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function savePackageSettings(packageId: string, projectId: string, input: PackageSettingsInput): Promise<ActionResult> {
  const parsed = packageSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_packages")
    .update({ round_step: parsed.data.roundStep })
    .eq("id", packageId)
    .eq("organization_id", ctx.organizationId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

export async function selectPackageTier(projectId: string, tier: PackageTier): Promise<ActionResult> {
  const ctx = await requireCurrentUserContext();
  const supabase = await createClient();
  const { error: clearError } = await supabase
    .from("project_packages")
    .update({ is_selected: false })
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId);
  if (clearError) return { error: clearError.message };

  const { error } = await supabase
    .from("project_packages")
    .update({ is_selected: true })
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("tier", tier);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { error: null, data: undefined };
}

/**
 * Generates a quotation directly from a package tier (mapping doc sheet
 * 13): creates a fresh draft quotation and adds the package price as a
 * single extra line item, reusing the same recompute path as any other
 * quotation item so discount/GST/round-off all apply normally.
 */
export async function generateQuotationFromPackage(
  projectId: string,
  tier: PackageTier,
  packagePriceValue: number
): Promise<ActionResult<{ id: string }>> {
  const draft = await createQuotationDraft(projectId);
  if (draft.error || !draft.data) return { error: draft.error ?? "Could not create quotation draft" };

  const itemResult = await addQuotationItem(draft.data.id, projectId, {
    roomLabel: "",
    itemDescription: `${PACKAGE_TIER_LABELS[tier]} Package - Complete Interior Package`,
    specification: "",
    unit: "lot",
    quantity: 1,
    rate: packagePriceValue,
  });
  if (itemResult.error) return itemResult;

  return { error: null, data: { id: draft.data.id } };
}
