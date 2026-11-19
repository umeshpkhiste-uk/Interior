import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Boxes,
  FileText,
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
  LayoutTemplate,
  Square,
  Box,
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
 * Items whose standalone page was just a "pick a project" list into the same
 * tab shown on the project detail page (Room Measurements, Interior Estimators,
 * BOQ Management, Design Fees, Package Comparison, Cost & Profit Analysis) were
 * dropped from this menu — they duplicated the project page's own tabs. Reach
 * those from Projects → open a project → its tabs instead.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Interior-Design-Business-Toolkit",
    icon: Wrench,
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Projects", href: "/projects", icon: Briefcase },
      { label: "Clients", href: "/clients", icon: Users },
      { label: "Material Library", href: "/materials", icon: Boxes },
      { label: "Quotations", href: "/quotations", icon: FileText },
      { label: "Rate Management", href: "/rates", icon: Tags },
    ],
  },
  {
    label: "Design",
    icon: LayoutTemplate,
    items: [
      { label: "2D Design", href: "/design/2d", icon: Square },
      { label: "3D Design", href: "/design/3d", icon: Box },
    ],
  },
  { label: "Leads", href: "/leads", icon: UserPlus },
  { label: "Design Approval", href: "/design-approval", icon: Stamp },
  { label: "Site Tracker", href: "/site-tracker", icon: MapPinned },
  { label: "Material Purchase", href: "/material-purchase", icon: Truck },
  { label: "Labour Payment", href: "/labour-payment", icon: HardHat },
  { label: "Profit & Billing", href: "/profit-billing", icon: Receipt },
  {
    label: "Preferences",
    icon: Settings,
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
];
