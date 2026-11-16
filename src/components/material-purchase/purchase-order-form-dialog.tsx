"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PurchaseOrderForm } from "./purchase-order-form";
import { createPurchaseOrder, updatePurchaseOrder } from "@/lib/actions/purchase-orders";
import type { PurchaseOrderInput } from "@/lib/validations/purchase-order";
import type { PurchaseOrderRow } from "@/lib/data/purchase-orders";
import type { VendorOption } from "@/lib/data/vendors";
import type { ProjectOption } from "@/lib/data/projects";

export function PurchaseOrderFormDialog({
  vendorOptions,
  projectOptions,
  order,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  vendorOptions: VendorOption[];
  projectOptions: ProjectOption[];
  order?: PurchaseOrderRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(order);

  const defaultValues: Partial<PurchaseOrderInput> | undefined = order
    ? {
        vendorId: order.vendor_id,
        projectId: order.project_id ?? "",
        orderDate: order.order_date,
        item: order.item,
        unit: order.unit,
        qty: order.qty,
        rate: order.rate,
        gstPct: order.gst_pct * 100,
        deliveryStatus: order.delivery_status,
      }
    : undefined;

  async function handleSubmit(values: PurchaseOrderInput) {
    const result = isEdit
      ? await updatePurchaseOrder(order!.id, values)
      : await createPurchaseOrder(values);
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
                Add Order
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit purchase order" : "Add a purchase order"}</DialogTitle>
        </DialogHeader>
        <PurchaseOrderForm
          vendorOptions={vendorOptions}
          projectOptions={projectOptions}
          defaultValues={defaultValues}
          submitLabel={isEdit ? "Save changes" : "Add order"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
