"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NAV_ITEMS } from "./nav-config";
import { cn } from "@/lib/utils";

export function MobileNav({ organizationName }: { organizationName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>{organizationName}</SheetTitle>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "relative flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "font-semibold text-foreground after:absolute after:inset-y-1.5 after:left-0 after:w-0.5 after:rounded-full after:bg-foreground"
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
        </nav>
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
