"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VendorPaymentForm } from "./vendor-payment-form";
import { createVendorPayment, updateVendorPayment } from "@/lib/actions/vendor-payments";
import type { VendorPaymentInput } from "@/lib/validations/vendor-payment";
import type { VendorPaymentRow } from "@/lib/data/vendor-payments";
import type { VendorOption } from "@/lib/data/vendors";

export function VendorPaymentFormDialog({
  vendorOptions,
  payment,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  vendorOptions: VendorOption[];
  payment?: VendorPaymentRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(payment);

  const defaultValues: Partial<VendorPaymentInput> | undefined = payment
    ? {
        vendorId: payment.vendor_id,
        paymentDate: payment.payment_date,
        amount: payment.amount,
        mode: payment.mode,
        reference: payment.reference ?? "",
      }
    : undefined;

  async function handleSubmit(values: VendorPaymentInput) {
    const result = isEdit
      ? await updateVendorPayment(payment!.id, values)
      : await createVendorPayment(values);
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
          <DialogTitle>{isEdit ? "Edit payment" : "Add a vendor payment"}</DialogTitle>
        </DialogHeader>
        <VendorPaymentForm
          vendorOptions={vendorOptions}
          defaultValues={defaultValues}
          submitLabel={isEdit ? "Save changes" : "Add payment"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
