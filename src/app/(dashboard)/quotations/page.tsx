import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function QuotationsPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Quotations"
      description="Generate, send, and track client quotations with immutable snapshots."
      phase="Phase 7"
    />
  );
}
