import { Badge } from "@/components/ui/badge";
import { PROJECT_STATUS_LABELS, type PROJECT_STATUSES } from "@/lib/validations/project";

const STATUS_VARIANT: Record<
  (typeof PROJECT_STATUSES)[number],
  "default" | "secondary" | "outline" | "destructive"
> = {
  enquiry: "outline",
  site_visit: "outline",
  measurements_pending: "secondary",
  design_in_progress: "secondary",
  estimation_in_progress: "secondary",
  quotation_sent: "secondary",
  approved: "default",
  execution_started: "default",
  completed: "default",
  cancelled: "destructive",
};

export function ProjectStatusBadge({ status }: { status: (typeof PROJECT_STATUSES)[number] }) {
  return <Badge variant={STATUS_VARIANT[status]}>{PROJECT_STATUS_LABELS[status]}</Badge>;
}
