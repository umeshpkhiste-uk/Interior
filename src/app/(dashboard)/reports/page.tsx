import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function ReportsPage() {
  return (
    <ComingSoon
      icon={BarChart3}
      title="Reports"
      description="Downloadable PDF and Excel reports: project cost, BOQ, quotations, profitability, and more."
      phase="Phase 9"
    />
  );
}
