import { TrendingUp } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function CostProfitPage() {
  return (
    <ComingSoon
      icon={TrendingUp}
      title="Cost & Profit Analysis"
      description="Material vs labour breakdown, overheads, supervision cost, and actual profit margin per project."
      phase="Phase 8"
    />
  );
}
