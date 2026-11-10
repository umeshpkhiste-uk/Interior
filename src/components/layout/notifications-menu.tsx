"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * No notifications table exists yet (not part of the Excel-derived schema
 * or the master prompt's data model) — this is an honest empty state, not
 * a stand-in for data that should exist. Wire this up to real events
 * (quotation viewed, rate revision impact, etc.) if/when that's requested.
 */
export function NotificationsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
          You&apos;re all caught up.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
