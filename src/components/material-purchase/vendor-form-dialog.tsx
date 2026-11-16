"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VendorForm } from "./vendor-form";
import { createSupplier, updateSupplier } from "@/lib/actions/materials";
import type { SupplierInput } from "@/lib/validations/materials";
import type { VendorRow } from "@/lib/data/vendors";

export function VendorFormDialog({
  vendor,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  vendor?: VendorRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(vendor);

  const defaultValues: Partial<SupplierInput> | undefined = vendor
    ? {
        name: vendor.name,
        category: vendor.category ?? "",
        creditDays: vendor.credit_days,
        contactPhone: vendor.contact_phone ?? "",
        contactEmail: vendor.contact_email ?? "",
        address: vendor.address ?? "",
        notes: vendor.notes ?? "",
      }
    : undefined;

  async function handleSubmit(values: SupplierInput) {
    const result = isEdit ? await updateSupplier(vendor!.id, values) : await createSupplier(values);
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
                Add Vendor
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit vendor" : "Add a vendor"}</DialogTitle>
        </DialogHeader>
        <VendorForm
          defaultValues={defaultValues}
          submitLabel={isEdit ? "Save changes" : "Add vendor"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
