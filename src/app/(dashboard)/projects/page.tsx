import { Briefcase } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function ProjectsPage() {
  return (
    <ComingSoon
      icon={Briefcase}
      title="Projects"
      description="Create and manage interior design projects, from enquiry through completion."
      phase="Phase 5"
    />
  );
}
