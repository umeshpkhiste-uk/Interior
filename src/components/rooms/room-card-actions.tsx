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
import { RoomFormDialog } from "./room-form-dialog";
import { deleteRoom } from "@/lib/actions/rooms";
import type { RoomRow } from "@/lib/data/rooms";

export function RoomCardActions({ room, projectId }: { room: RoomRow; projectId: string }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete "${room.room_name}"? This also removes its openings.`)) return;
    const result = await deleteRoom(room.id, projectId);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Room actions">
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
      <RoomFormDialog projectId={projectId} room={room} trigger={null} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
