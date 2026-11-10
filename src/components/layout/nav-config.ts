import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Ruler,
  Calculator,
  Boxes,
  ClipboardList,
  FileText,
  Percent,
  Layers,
  TrendingUp,
  Tags,
  BarChart3,
  Settings,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/** The 14-item primary navigation, in the order given by the master prompt. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: Briefcase },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Room Measurements", href: "/rooms", icon: Ruler },
  { label: "Interior Estimators", href: "/estimators", icon: Calculator },
  { label: "Material Library", href: "/materials", icon: Boxes },
  { label: "BOQ Management", href: "/boq", icon: ClipboardList },
  { label: "Quotations", href: "/quotations", icon: FileText },
  { label: "Design Fees", href: "/design-fees", icon: Percent },
  { label: "Package Comparison", href: "/packages", icon: Layers },
  { label: "Cost & Profit Analysis", href: "/cost-profit", icon: TrendingUp },
  { label: "Rate Management", href: "/rates", icon: Tags },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];
