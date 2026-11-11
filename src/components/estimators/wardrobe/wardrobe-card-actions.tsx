"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WardrobeFormDialog } from "./wardrobe-form-dialog";
import { deleteWardrobe } from "@/lib/actions/wardrobes";
import type { WardrobeRow } from "@/lib/data/wardrobes";
import type { RoomOption } from "@/lib/data/rooms";

export function WardrobeCardActions({
  wardrobe,
  projectId,
  rooms,
}: {
  wardrobe: WardrobeRow;
  projectId: string;
  rooms: RoomOption[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete "${wardrobe.name}"? This also removes its components.`)) return;
    const result = await deleteWardrobe(wardrobe.id, projectId);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Wardrobe actions">
              <MoreVertical className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} variant="destructive">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <WardrobeFormDialog
        projectId={projectId}
        rooms={rooms}
        wardrobe={wardrobe}
        trigger={null}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
