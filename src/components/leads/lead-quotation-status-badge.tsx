import { Badge } from "@/components/ui/badge";
import { LEAD_QUOTATION_STATUS_LABELS } from "@/lib/validations/lead-quotation";
import type { Database } from "@/lib/supabase/types";

type LeadQuotationStatus = Database["public"]["Enums"]["lead_quotation_status"];

const STATUS_VARIANT: Record<LeadQuotationStatus, "default" | "secondary" | "outline" | "destructive"> = {
  sent: "secondary",
  revised: "secondary",
  accepted: "default",
  declined: "destructive",
  superseded: "outline",
};

export function LeadQuotationStatusBadge({ status }: { status: LeadQuotationStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{LEAD_QUOTATION_STATUS_LABELS[status]}</Badge>;
}
