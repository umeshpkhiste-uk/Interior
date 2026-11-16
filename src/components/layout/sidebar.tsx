"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown, Building2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "./nav-config";
import { GlobalSearch } from "./global-search";
import { ThemeToggle } from "./theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "./user-menu";
import { SignOutDialog } from "./sign-out-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar({
  organizationName,
  fullName,
  email,
}: {
  organizationName: string;
  fullName: string | null;
  email: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      NAV_GROUPS.filter((g) => g.items).map((g) => [
        g.label,
        g.items!.some(
          (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
        ) || g === NAV_GROUPS[0],
      ])
    )
  );

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
        collapsed ? "w-[72px]" : "w-72"
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b px-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary/10 text-sidebar-primary">
          <Building2 className="size-5" />
        </div>
        {!collapsed && (
          <span className="truncate font-heading text-sm font-semibold">
            {organizationName}
          </span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full border bg-sidebar text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground",
            collapsed ? "mx-auto" : "ml-auto"
          )}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="px-3 pt-3">
          <GlobalSearch />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {!collapsed && (
          <p className="px-3 pb-1.5 text-xs font-medium uppercase tracking-wide text-sidebar-foreground/40">
            Menu
          </p>
        )}
        <ul className="flex flex-col gap-0.5">
          {NAV_GROUPS.map((group) => {
            if (!group.items) {
              const isActive =
                pathname === group.href || pathname.startsWith(`${group.href}/`);
              const link = (
                <Link
                  href={group.href!}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground after:absolute after:inset-y-1.5 after:-left-2 after:w-1 after:rounded-r-full after:bg-sidebar-primary"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <group.icon className="size-4 shrink-0" />
                  {!collapsed && <span className="truncate">{group.label}</span>}
                </Link>
              );

              return (
                <li key={group.label}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger render={link} />
                      <TooltipContent side="right">{group.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              );
            }

            const isOpen = collapsed || (openGroups[group.label] ?? false);
            const groupActive = group.items.some(
              (item) =>
                pathname === item.href || pathname.startsWith(`${item.href}/`)
            );

            return (
              <li key={group.label}>
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenGroups((prev) => ({
                        ...prev,
                        [group.label]: !prev[group.label],
                      }))
                    }
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      groupActive
                        ? "text-sidebar-foreground"
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                    )}
                  >
                    <group.icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate text-left">{group.label}</span>
                    <ChevronDown
                      className={cn(
                        "size-3.5 shrink-0 transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                )}
                {isOpen && (
                  <ul
                    className={cn(
                      "flex flex-col gap-0.5",
                      !collapsed && "mt-0.5 border-l border-sidebar-border pl-3"
                    )}
                  >
                    {group.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                      const link = (
                        <Link
                          href={item.href}
                          className={cn(
                            "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground after:absolute after:inset-y-1.5 after:-left-2 after:w-1 after:rounded-r-full after:bg-sidebar-primary"
                              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                            collapsed && "justify-center px-0"
                          )}
                        >
                          <item.icon className="size-4 shrink-0" />
                          {!collapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </Link>
                      );

                      return (
                        <li key={item.href}>
                          {collapsed ? (
                            <Tooltip>
                              <TooltipTrigger render={link} />
                              <TooltipContent side="right">
                                {item.label}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            link
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-3 border-t p-3">
        <ThemeToggle collapsed={collapsed} />

        <div className="flex items-center gap-2">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback>{initials(fullName, email)}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {fullName ?? "Studio member"}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">{email}</p>
              </div>
              <SignOutDialog>
                <button
                  type="button"
                  aria-label="Sign out"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                >
                  <LogOut className="size-4" />
                </button>
              </SignOutDialog>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
