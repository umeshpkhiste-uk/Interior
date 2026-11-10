import { Layers } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function PackagesPage() {
  return (
    <ComingSoon
      icon={Layers}
      title="Package Comparison"
      description="Compare Basic, Premium, and Luxury packages side by side and generate a quotation from one."
      phase="Phase 7"
    />
  );
}
