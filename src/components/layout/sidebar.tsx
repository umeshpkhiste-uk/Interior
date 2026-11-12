"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-config";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar({ organizationName }: { organizationName: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b px-4">
        {!collapsed && (
          <span className="truncate font-heading text-sm font-semibold">
            {organizationName}
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const link = (
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "font-semibold text-sidebar-foreground after:absolute after:inset-y-1.5 after:left-0 after:w-0.5 after:rounded-full after:bg-sidebar-foreground"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );

            return (
              <li key={item.href}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger render={link} />
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  link
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-2">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <>
              <PanelLeftClose className="size-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
