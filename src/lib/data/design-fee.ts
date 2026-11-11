import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type DesignFeeRow = Database["public"]["Tables"]["design_fees"]["Row"];
export type DesignFeeStageRow = Database["public"]["Tables"]["design_fee_stages"]["Row"];

export type DesignFeeWithStages = DesignFeeRow & { stages: DesignFeeStageRow[] };

export async function getDesignFee(organizationId: string, projectId: string): Promise<DesignFeeWithStages | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("design_fees")
    .select("*, design_fee_stages(*)")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { design_fee_stages, ...rest } = data as typeof data & { design_fee_stages: DesignFeeStageRow[] };
  return { ...rest, stages: design_fee_stages ?? [] };
}
