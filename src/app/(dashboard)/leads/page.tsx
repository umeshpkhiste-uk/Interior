import { UserPlus } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function ClientLeadPage() {
  return (
    <ComingSoon
      icon={UserPlus}
      title="Client-Lead"
      description="Capture and track leads before they become clients."
      phase="a future update"
    />
  );
}
