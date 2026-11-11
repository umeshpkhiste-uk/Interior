"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/validations/project";

export function ProjectStatusFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "all";

  function update(status: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!status || status === "all") params.delete("status");
    else params.set("status", status);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={current} onValueChange={update}>
      <SelectTrigger className="w-48">
        <SelectValue>
          {(value: string | null) =>
            !value || value === "all"
              ? "All statuses"
              : PROJECT_STATUS_LABELS[value as keyof typeof PROJECT_STATUS_LABELS]
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        {PROJECT_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {PROJECT_STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
