"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AdvanceForm } from "./advance-form";
import { createLabourAdvance, updateLabourAdvance } from "@/lib/actions/labour-advances";
import type { LabourAdvanceInput } from "@/lib/validations/labour-advance";
import type { LabourAdvanceListItem } from "@/lib/data/labour-advances";
import type { WorkerOption } from "@/lib/data/workers";

export function AdvanceFormDialog({
  workerOptions,
  advance,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  workerOptions: WorkerOption[];
  advance?: LabourAdvanceListItem;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(advance);

  const defaultValues: Partial<LabourAdvanceInput> | undefined = advance
    ? {
        workerId: advance.worker_id,
        advanceDate: advance.advance_date,
        amount: advance.amount,
        reason: advance.reason ?? "",
      }
    : undefined;

  async function handleSubmit(values: LabourAdvanceInput) {
    const result = isEdit ? await updateLabourAdvance(advance!.id, values) : await createLabourAdvance(values);
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
                Add Advance
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit advance" : "Add an advance"}</DialogTitle>
        </DialogHeader>
        <AdvanceForm workerOptions={workerOptions} defaultValues={defaultValues} submitLabel={isEdit ? "Save changes" : "Add advance"} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
