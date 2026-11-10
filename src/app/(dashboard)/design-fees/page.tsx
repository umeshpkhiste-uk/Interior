import { Percent } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function DesignFeesPage() {
  return (
    <ComingSoon
      icon={Percent}
      title="Design Fees"
      description="Calculate design fees by percentage, per-sq-ft rate, or fixed amount."
      phase="Phase 7"
    />
  );
}
