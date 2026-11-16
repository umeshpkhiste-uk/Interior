"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ReceiptForm, type ReceiptFormInput } from "./receipt-form";
import { addPayment } from "@/lib/actions/expenses";
import type { ProjectOption } from "@/lib/data/projects";
import type { InvoiceOption } from "@/lib/data/invoices";

export function ReceiptFormDialog({
  projectOptions,
  invoiceOptions,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  projectOptions: ProjectOption[];
  invoiceOptions: InvoiceOption[];
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();

  async function handleSubmit(values: ReceiptFormInput) {
    const { projectId, ...rest } = values;
    const result = await addPayment(projectId, rest);
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
                Add Receipt
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a receipt</DialogTitle>
        </DialogHeader>
        <ReceiptForm projectOptions={projectOptions} invoiceOptions={invoiceOptions} submitLabel="Add receipt" onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
