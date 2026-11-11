import { Badge } from "@/components/ui/badge";
import { QUOTATION_STATUS_LABELS } from "@/lib/validations/quotation";
import type { Database } from "@/lib/supabase/types";

type QuotationStatus = Database["public"]["Enums"]["quotation_status"];

const STATUS_VARIANT: Record<QuotationStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  sent: "secondary",
  viewed: "secondary",
  approved: "default",
  rejected: "destructive",
  expired: "destructive",
};

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{QUOTATION_STATUS_LABELS[status]}</Badge>;
}
