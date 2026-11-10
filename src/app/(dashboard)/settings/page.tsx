import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function SettingsPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Settings"
      description="Studio profile, team members and roles, and default GST/contingency rates."
      phase="Phase 5"
    />
  );
}
