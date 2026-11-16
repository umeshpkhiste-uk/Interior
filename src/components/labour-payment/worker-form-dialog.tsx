"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WorkerForm } from "./worker-form";
import { createWorker, updateWorker } from "@/lib/actions/workers";
import type { WorkerInput } from "@/lib/validations/worker";
import type { WorkerRow } from "@/lib/data/workers";

export function WorkerFormDialog({
  worker,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  worker?: WorkerRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(worker);

  const defaultValues: Partial<WorkerInput> | undefined = worker
    ? {
        name: worker.name,
        trade: worker.trade,
        dailyWage: worker.daily_wage,
        phone: worker.phone ?? "",
        team: worker.team ?? "",
      }
    : undefined;

  async function handleSubmit(values: WorkerInput) {
    const result = isEdit ? await updateWorker(worker!.id, values) : await createWorker(values);
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
                Add Worker
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit worker" : "Add a worker"}</DialogTitle>
        </DialogHeader>
        <WorkerForm defaultValues={defaultValues} submitLabel={isEdit ? "Save changes" : "Add worker"} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
