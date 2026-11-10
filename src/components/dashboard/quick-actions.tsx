import Link from "next/link";
import { FilePlus2, FolderPlus, Ruler, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACTIONS = [
  { label: "Create New Project", href: "/projects", icon: FolderPlus },
  { label: "Add New Client", href: "/clients", icon: UserPlus },
  { label: "Start Cost Estimation", href: "/rooms", icon: Ruler },
  { label: "Generate Quotation", href: "/quotations", icon: FilePlus2 },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          size="sm"
          render={
            <Link href={action.href}>
              <action.icon className="size-4" />
              {action.label}
            </Link>
          }
        />
      ))}
    </div>
  );
}
