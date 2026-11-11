"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { deleteInspirationImage } from "@/lib/actions/inspiration";
import { INSPIRATION_CATEGORIES, INSPIRATION_CATEGORY_LABELS } from "@/lib/validations/inspiration";
import type { InspirationImageWithUrl, MoodboardRow } from "@/lib/data/inspiration";

export function ImageGallery({
  projectId,
  images,
  moodboards,
}: {
  projectId: string;
  images: InspirationImageWithUrl[];
  moodboards: MoodboardRow[];
}) {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [moodboardFilter, setMoodboardFilter] = useState<string>("all");

  const filtered = useMemo(
    () =>
      images.filter(
        (img) =>
          (categoryFilter === "all" || img.category === categoryFilter) &&
          (moodboardFilter === "all" || img.moodboard_id === moodboardFilter)
      ),
    [images, categoryFilter, moodboardFilter]
  );

  async function handleDelete(id: string) {
    const result = await deleteInspirationImage(projectId, id);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue>
              {() => (categoryFilter === "all" ? "All categories" : INSPIRATION_CATEGORY_LABELS[categoryFilter])}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {INSPIRATION_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {INSPIRATION_CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={moodboardFilter} onValueChange={(v) => setMoodboardFilter(v ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue>
              {() =>
                moodboardFilter === "all" ? "All moodboards" : moodboards.find((m) => m.id === moodboardFilter)?.name ?? "All moodboards"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All moodboards</SelectItem>
            {moodboards.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">No inspiration images yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Upload reference images, group them into moodboards, and attach notes or material specifications.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((img) => (
            <Card key={img.id} className="overflow-hidden">
              <div className="relative aspect-video w-full bg-muted">
                {img.signedUrl ? (
                  <Image src={img.signedUrl} alt={img.notes ?? "Inspiration image"} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Image unavailable</div>
                )}
              </div>
              <CardContent className="flex flex-col gap-2 py-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">{INSPIRATION_CATEGORY_LABELS[img.category]}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(img.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                {img.roomName && <p className="text-xs text-muted-foreground">Room: {img.roomName}</p>}
                {img.material_specification && (
                  <p className="text-xs"><span className="text-muted-foreground">Material: </span>{img.material_specification}</p>
                )}
                {img.notes && <p className="text-xs text-muted-foreground">{img.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
