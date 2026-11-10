import { Boxes } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function MaterialsPage() {
  return (
    <ComingSoon
      icon={Boxes}
      title="Material Library"
      description="Browse and manage the materials, hardware, and reference rates used across estimators."
      phase="Phase 6"
    />
  );
}
