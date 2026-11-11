"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WardrobeForm } from "./wardrobe-form";
import { createWardrobe, updateWardrobe } from "@/lib/actions/wardrobes";
import type { WardrobeInput } from "@/lib/validations/wardrobe";
import type { WardrobeRow } from "@/lib/data/wardrobes";
import type { RoomOption } from "@/lib/data/rooms";

export function WardrobeFormDialog({
  projectId,
  rooms,
  wardrobe,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  projectId: string;
  rooms: RoomOption[];
  wardrobe?: WardrobeRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(wardrobe);

  const defaultValues: Partial<WardrobeInput> | undefined = wardrobe
    ? {
        name: wardrobe.name,
        roomId: wardrobe.room_id ?? "",
        width: Number(wardrobe.width ?? 0),
        height: Number(wardrobe.height ?? 0),
        depth: Number(wardrobe.depth ?? 0),
        shutterType: wardrobe.shutter_type,
        hingedRate: Number(wardrobe.hinged_rate),
        slidingRate: Number(wardrobe.sliding_rate),
        hasLoft: wardrobe.has_loft,
        loftHeight: Number(wardrobe.loft_height),
        loftRate: Number(wardrobe.loft_rate),
        installLabourPct: Number(wardrobe.install_labour_pct) * 100,
        marginPct: Number(wardrobe.margin_pct) * 100,
        roundingUnit: Number(wardrobe.rounding_unit),
      }
    : undefined;

  async function handleSubmit(values: WardrobeInput) {
    const result = isEdit
      ? await updateWardrobe(wardrobe!.id, projectId, values)
      : await createWardrobe(projectId, values);
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
                Add Wardrobe
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit wardrobe" : "Add a wardrobe"}</DialogTitle>
        </DialogHeader>
        <WardrobeForm
          defaultValues={defaultValues}
          rooms={rooms}
          submitLabel={isEdit ? "Save changes" : "Add wardrobe"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
