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
  Wrench,
  UserPlus,
  Stamp,
  MapPinned,
  Truck,
  HardHat,
  Receipt,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/** A top-level sidebar entry: either a single link, or a collapsible group of links. */
export type NavGroup = {
  label: string;
  icon: LucideIcon;
  href?: string;
  items?: NavItem[];
};

/**
 * The 14 original items, now nested under a single "Interior-Design-Business-Toolkit"
 * parent menu, followed by the newly added top-level business-kit menus.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Interior-Design-Business-Toolkit",
    icon: Wrench,
    items: [
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
    ],
  },
  { label: "Client-Lead", href: "/leads", icon: UserPlus },
  { label: "Design-Approval", href: "/design-approval", icon: Stamp },
  { label: "Project-Site-Tracker-Kit", href: "/site-tracker", icon: MapPinned },
  { label: "Material-Purchase-Vendor-Kit", href: "/material-purchase", icon: Truck },
  { label: "Labour-Carpenter-Payment-Kit", href: "/labour-payment", icon: HardHat },
  { label: "Project-Profit-Billing-Kit", href: "/profit-billing", icon: Receipt },
];
