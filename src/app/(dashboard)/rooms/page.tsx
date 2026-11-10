import { Ruler } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function RoomsPage() {
  return (
    <ComingSoon
      icon={Ruler}
      title="Room Measurements"
      description="Capture room dimensions, openings, and area summaries per project."
      phase="Phase 6"
    />
  );
}
