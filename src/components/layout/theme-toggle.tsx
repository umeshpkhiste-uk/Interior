"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Renders nothing meaningful until mounted — next-themes can't know the
 * resolved theme during SSR, and rendering a guess would mismatch on
 * hydration. A static placeholder matching the real control's footprint
 * avoids layout shift once it mounts.
 */
export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (collapsed) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex w-full items-center justify-center rounded-full p-2 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      >
        {mounted && theme === "dark" ? (
          <Moon className="size-4" />
        ) : (
          <Sun className="size-4" />
        )}
      </button>
    );
  }

  return (
    <div className="inline-flex w-full items-center gap-1 rounded-full bg-sidebar-accent/40 p-1">
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-pressed={mounted && theme === "light"}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
          mounted && theme === "light"
            ? "bg-sidebar text-sidebar-foreground shadow-sm"
            : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
        )}
      >
        <Sun className="size-4" />
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-pressed={mounted && theme === "dark"}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
          mounted && theme === "dark"
            ? "bg-sidebar text-sidebar-foreground shadow-sm"
            : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
        )}
      >
        <Moon className="size-4" />
        Dark
      </button>
    </div>
  );
}
