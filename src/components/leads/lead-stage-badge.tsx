import { Badge } from "@/components/ui/badge";
import { LEAD_STAGE_LABELS } from "@/lib/validations/lead";
import type { Database } from "@/lib/supabase/types";

type LeadStage = Database["public"]["Enums"]["lead_stage"];

const STAGE_VARIANT: Record<LeadStage, "default" | "secondary" | "outline" | "destructive"> = {
  new: "outline",
  site_visit_done: "secondary",
  design_shared: "secondary",
  quotation_sent: "secondary",
  negotiation: "secondary",
  won: "default",
  lost: "destructive",
};

export function LeadStageBadge({ stage }: { stage: LeadStage }) {
  return <Badge variant={STAGE_VARIANT[stage]}>{LEAD_STAGE_LABELS[stage]}</Badge>;
}
