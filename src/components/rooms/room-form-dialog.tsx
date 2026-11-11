"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RoomForm } from "./room-form";
import { createRoom, updateRoom } from "@/lib/actions/rooms";
import type { RoomInput } from "@/lib/validations/room";
import type { RoomRow } from "@/lib/data/rooms";

export function RoomFormDialog({
  projectId,
  room,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  projectId: string;
  room?: RoomRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(room);

  const defaultValues: Partial<RoomInput> | undefined = room
    ? {
        roomName: room.room_name,
        roomCategory: room.room_category,
        unitSystem: room.unit_system,
        length: Number(room.length ?? 0),
        width: Number(room.width ?? 0),
        height: Number(room.height ?? 0),
      }
    : undefined;

  async function handleSubmit(values: RoomInput) {
    const result = isEdit ? await updateRoom(room!.id, projectId, values) : await createRoom(projectId, values);
    if (!result.error) {
      setOpen(false);
      router.refresh();
    }
    return { error: result.error };
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger
          render={
            trigger ?? (
              <Button size="sm">
                <Plus className="size-4" />
                Add Room
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit room" : "Add a room"}</DialogTitle>
        </DialogHeader>
        <RoomForm
          defaultValues={defaultValues}
          submitLabel={isEdit ? "Save changes" : "Add room"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
