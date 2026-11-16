import { Stamp } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function DesignApprovalPage() {
  return (
    <ComingSoon
      icon={Stamp}
      title="Design-Approval"
      description="Share design drafts with clients and track sign-off."
      phase="a future update"
    />
  );
}
