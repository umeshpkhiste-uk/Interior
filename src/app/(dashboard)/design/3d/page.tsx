import { Box } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function Design3DPage() {
  return (
    <ComingSoon
      icon={Box}
      title="3D Design"
      description="Walk through the project's rooms in 3D, with walls, doors and windows placed."
      phase="a future update"
    />
  );
}
