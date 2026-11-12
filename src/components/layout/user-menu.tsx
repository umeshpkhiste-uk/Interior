"use client";

import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/actions/auth";

export function initials(name: string | null, email: string): string {
  if (name && name.trim().length > 0) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }
  return email.slice(0, 2).toUpperCase();
}

export function UserMenu({
  fullName,
  email,
  role,
}: {
  fullName: string | null;
  email: string;
  role: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-8">
          <AvatarFallback>{initials(fullName, email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5 font-normal">
            <span className="text-sm font-medium text-foreground">
              {fullName ?? "Studio member"}
            </span>
            <span className="truncate text-xs text-muted-foreground">{email}</span>
            <span className="mt-0.5 text-xs capitalize text-muted-foreground">
              {role.replace("_", " ")}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <Link href="/settings">
              <User />
              Profile
            </Link>
          }
        />
        <DropdownMenuItem
          render={
            <Link href="/settings">
              <Settings />
              Studio settings
            </Link>
          }
        />
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem
            variant="destructive"
            render={
              <button type="submit" className="w-full">
                <LogOut />
                Sign out
              </button>
            }
          />
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
