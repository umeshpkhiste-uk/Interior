"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HandoverCheckForm } from "./handover-check-form";
import { createHandoverCheck, updateHandoverCheck } from "@/lib/actions/handover-checks";
import type { HandoverCheckInput } from "@/lib/validations/handover-check";
import type { HandoverCheckRow } from "@/lib/data/handover-checks";
import type { ProjectOption } from "@/lib/data/projects";

export function HandoverCheckFormDialog({
  projectOptions,
  check,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  projectOptions: ProjectOption[];
  check?: HandoverCheckRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(check);

  const defaultValues: Partial<HandoverCheckInput> | undefined = check
    ? {
        projectId: check.project_id,
        roomArea: check.room_area ?? "",
        checkItem: check.check_item,
        checkedBy: check.checked_by ?? "",
        checkedOn: check.checked_on ?? "",
        result: check.result ?? undefined,
      }
    : undefined;

  async function handleSubmit(values: HandoverCheckInput) {
    const result = isEdit
      ? await updateHandoverCheck(check!.id, values)
      : await createHandoverCheck(values);
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
                Add Check
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit check" : "Add a handover check"}</DialogTitle>
        </DialogHeader>
        <HandoverCheckForm
          projectOptions={projectOptions}
          defaultValues={defaultValues}
          submitLabel={isEdit ? "Save changes" : "Add check"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
