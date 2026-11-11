"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { deleteMoodboard } from "@/lib/actions/inspiration";
import type { MoodboardRow } from "@/lib/data/inspiration";

export function MoodboardList({ projectId, moodboards }: { projectId: string; moodboards: MoodboardRow[] }) {
  const router = useRouter();

  if (moodboards.length === 0) return null;

  async function handleDelete(id: string) {
    const result = await deleteMoodboard(projectId, id);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {moodboards.map((m) => (
        <Badge key={m.id} variant="secondary" className="gap-2 py-1.5 pl-3 pr-1.5">
          <span>{m.name}</span>
          <button
            type="button"
            onClick={() => handleDelete(m.id)}
            className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
            aria-label={`Delete moodboard ${m.name}`}
          >
            <Trash2 className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}
