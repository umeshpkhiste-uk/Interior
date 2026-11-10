import { Calculator } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function EstimatorsPage() {
  return (
    <ComingSoon
      icon={Calculator}
      title="Interior Estimators"
      description="Modular kitchen, wardrobe, plywood & laminate, false ceiling, paint & wallpaper, flooring, and electrical cost estimators."
      phase="Phase 6"
    />
  );
}
