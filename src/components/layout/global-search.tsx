"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";

/**
 * Searches clients and projects by name. A real query against Supabase,
 * routed through /search — not a decorative input. The results page itself
 * is built out in Phase 5 alongside client/project CRUD; this box is wired
 * to it now so it's never a dead end.
 */
export function GlobalSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q.length === 0) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={onSubmit} className="relative hidden w-full max-w-sm md:block">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search clients, projects..."
        className="pl-8"
        aria-label="Search"
      />
    </form>
  );
}
