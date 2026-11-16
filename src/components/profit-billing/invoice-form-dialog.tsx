"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InvoiceForm } from "./invoice-form";
import { createInvoice, updateInvoice } from "@/lib/actions/invoices";
import type { InvoiceInput } from "@/lib/validations/invoice";
import type { InvoiceListItem } from "@/lib/data/invoices";
import type { ProjectOption } from "@/lib/data/projects";

export function InvoiceFormDialog({
  projectOptions,
  invoice,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  projectOptions: ProjectOption[];
  invoice?: InvoiceListItem;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(invoice);

  const defaultValues: Partial<InvoiceInput> | undefined = invoice
    ? {
        projectId: invoice.project_id,
        invoiceDate: invoice.invoice_date,
        milestone: invoice.milestone,
        amount: invoice.amount,
        gstPct: invoice.gst_pct * 100,
        dueDate: invoice.due_date ?? "",
      }
    : undefined;

  async function handleSubmit(values: InvoiceInput) {
    const result = isEdit ? await updateInvoice(invoice!.id, values) : await createInvoice(values);
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
                Add Invoice
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit invoice" : "Add an invoice"}</DialogTitle>
        </DialogHeader>
        <InvoiceForm projectOptions={projectOptions} defaultValues={defaultValues} submitLabel={isEdit ? "Save changes" : "Add invoice"} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
