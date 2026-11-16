"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NAV_GROUPS } from "./nav-config";
import { GlobalSearch } from "./global-search";
import { ThemeToggle } from "./theme-toggle";
import { initials } from "./user-menu";
import { SignOutDialog } from "./sign-out-dialog";
import { cn } from "@/lib/utils";

export function MobileNav({
  organizationName,
  fullName,
  email,
}: {
  organizationName: string;
  fullName: string | null;
  email: string;
}) {
  const [open, setOpen] = useState(false);
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="flex w-72 flex-col p-0">
        <SheetHeader className="border-b">
          <SheetTitle>{organizationName}</SheetTitle>
        </SheetHeader>

        <div className="px-3 pt-3">
          <GlobalSearch />
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <p className="px-3 pb-1.5 text-xs font-medium uppercase tracking-wide text-foreground/40">
            Menu
          </p>
          <ul className="flex flex-col gap-0.5">
            {NAV_GROUPS.map((group) => {
              if (!group.items) {
                const isActive =
                  pathname === group.href || pathname.startsWith(`${group.href}/`);
                return (
                  <li key={group.label}>
                    <Link
                      href={group.href!}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground after:absolute after:inset-y-1.5 after:-left-2 after:w-1 after:rounded-r-full after:bg-primary"
                          : "text-foreground/60 hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      <group.icon className="size-4 shrink-0" />
                      <span className="truncate">{group.label}</span>
                    </Link>
                  </li>
                );
              }

              const isOpen = openGroups[group.label] ?? false;
              const groupActive = group.items.some(
                (item) =>
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
              );

              return (
                <li key={group.label}>
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
                        ? "text-foreground"
                        : "text-foreground/60 hover:text-foreground"
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
                  {isOpen && (
                    <ul className="mt-0.5 flex flex-col gap-0.5 border-l pl-3">
                      {group.items.map((item) => {
                        const isActive =
                          pathname === item.href ||
                          pathname.startsWith(`${item.href}/`);
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                  ? "bg-accent text-accent-foreground after:absolute after:inset-y-1.5 after:-left-2 after:w-1 after:rounded-r-full after:bg-primary"
                                  : "text-foreground/60 hover:bg-accent/50 hover:text-foreground"
                              )}
                            >
                              <item.icon className="size-4 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </Link>
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
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback>{initials(fullName, email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{fullName ?? "Studio member"}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
            <SignOutDialog>
              <button
                type="button"
                aria-label="Sign out"
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-accent/50 hover:text-foreground"
              >
                <LogOut className="size-4" />
              </button>
            </SignOutDialog>
          </div>
        </div>
      </SheetContent>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>
    </Sheet>
  );
}
