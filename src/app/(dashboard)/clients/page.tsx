import { Users } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function ClientsPage() {
  return (
    <ComingSoon
      icon={Users}
      title="Clients"
      description="Manage client contacts, properties, and their project history."
      phase="Phase 5"
    />
  );
}
