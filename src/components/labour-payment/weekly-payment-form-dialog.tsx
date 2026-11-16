"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WeeklyPaymentForm } from "./weekly-payment-form";
import { createLabourWeeklyPayment, updateLabourWeeklyPayment } from "@/lib/actions/labour-weekly-payments";
import type { LabourWeeklyPaymentInput } from "@/lib/validations/labour-weekly-payment";
import type { LabourWeeklyPaymentListItem } from "@/lib/data/labour-weekly-payments";
import type { WorkerOption } from "@/lib/data/workers";

export function WeeklyPaymentFormDialog({
  workerOptions,
  payment,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  workerOptions: WorkerOption[];
  payment?: LabourWeeklyPaymentListItem;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(payment);

  const defaultValues: Partial<LabourWeeklyPaymentInput> | undefined = payment
    ? {
        workerId: payment.worker_id,
        weekStarting: payment.week_starting,
        advanceRecovered: payment.advance_recovered,
        paid: payment.paid,
        mode: payment.mode as LabourWeeklyPaymentInput["mode"],
      }
    : undefined;

  async function handleSubmit(values: LabourWeeklyPaymentInput) {
    const result = isEdit ? await updateLabourWeeklyPayment(payment!.id, values) : await createLabourWeeklyPayment(values);
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
                Add Payment
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit weekly payment" : "Add a weekly payment"}</DialogTitle>
        </DialogHeader>
        <WeeklyPaymentForm workerOptions={workerOptions} defaultValues={defaultValues} submitLabel={isEdit ? "Save changes" : "Add payment"} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
