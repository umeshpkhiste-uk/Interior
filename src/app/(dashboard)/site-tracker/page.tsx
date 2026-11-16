import { MapPinned } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function ProjectSiteTrackerPage() {
  return (
    <ComingSoon
      icon={MapPinned}
      title="Project-Site-Tracker-Kit"
      description="Track on-site progress and milestones across projects."
      phase="a future update"
    />
  );
}
