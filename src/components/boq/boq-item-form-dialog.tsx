"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BoqItemForm } from "./boq-item-form";
import { addManualBoqItem, updateManualBoqItem } from "@/lib/actions/boq";
import type { BoqItemInput } from "@/lib/validations/boq";
import type { BoqItemRow } from "@/lib/data/boq";
import type { RoomOption } from "@/lib/data/rooms";

export function BoqItemFormDialog({
  projectId,
  rooms,
  item,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  projectId: string;
  rooms: RoomOption[];
  item?: BoqItemRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(item);

  const defaultValues: Partial<BoqItemInput> | undefined = item
    ? {
        roomId: item.room_id ?? "",
        workCategory: item.work_category ?? "",
        itemDescription: item.item_description,
        specification: item.specification ?? "",
        brand: item.brand ?? "",
        unit: item.unit ?? "",
        quantity: Number(item.quantity),
        materialRate: Number(item.material_rate),
        labourRate: Number(item.labour_rate),
      }
    : undefined;

  async function handleSubmit(values: BoqItemInput) {
    const result = isEdit ? await updateManualBoqItem(item!.id, projectId, values) : await addManualBoqItem(projectId, values);
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
                Add Manual Item
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit BOQ item" : "Add a manual BOQ item"}</DialogTitle>
        </DialogHeader>
        <BoqItemForm
          defaultValues={defaultValues}
          rooms={rooms}
          submitLabel={isEdit ? "Save changes" : "Add item"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
