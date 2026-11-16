"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WarrantyForm } from "./warranty-form";
import { createWarranty, updateWarranty } from "@/lib/actions/warranties";
import type { WarrantyInput } from "@/lib/validations/warranty";
import type { WarrantyRow } from "@/lib/data/warranties";
import type { ProjectOption } from "@/lib/data/projects";

export function WarrantyFormDialog({
  projectOptions,
  warranty,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  projectOptions: ProjectOption[];
  warranty?: WarrantyRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(warranty);

  const defaultValues: Partial<WarrantyInput> | undefined = warranty
    ? {
        projectId: warranty.project_id,
        item: warranty.item,
        handoverDate: warranty.handover_date,
        warrantyYears: warranty.warranty_years,
      }
    : undefined;

  async function handleSubmit(values: WarrantyInput) {
    const result = isEdit ? await updateWarranty(warranty!.id, values) : await createWarranty(values);
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
                Add Warranty
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit warranty" : "Add a warranty"}</DialogTitle>
        </DialogHeader>
        <WarrantyForm
          projectOptions={projectOptions}
          defaultValues={defaultValues}
          submitLabel={isEdit ? "Save changes" : "Add warranty"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
