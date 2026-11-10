import { Tags } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function RatesPage() {
  return (
    <ComingSoon
      icon={Tags}
      title="Rate Management"
      description="Review, revise, and track the history of material and labour rates. Approved quotations always keep their original rates."
      phase="Phase 8"
    />
  );
}
