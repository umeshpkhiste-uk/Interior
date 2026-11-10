import { ClipboardList } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function BoqPage() {
  return (
    <ComingSoon
      icon={ClipboardList}
      title="BOQ Management"
      description="The Full Home Bill of Quantities, synced from every estimator module."
      phase="Phase 7"
    />
  );
}
