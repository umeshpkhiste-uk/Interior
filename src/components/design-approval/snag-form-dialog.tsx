"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SnagForm } from "./snag-form";
import { createSnag, updateSnag } from "@/lib/actions/snags";
import type { SnagInput } from "@/lib/validations/snag";
import type { SnagRow } from "@/lib/data/snags";
import type { ProjectOption } from "@/lib/data/projects";

export function SnagFormDialog({
  projectOptions,
  snag,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  projectOptions: ProjectOption[];
  snag?: SnagRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(snag);

  const defaultValues: Partial<SnagInput> | undefined = snag
    ? {
        projectId: snag.project_id,
        roomArea: snag.room_area ?? "",
        item: snag.item,
        issue: snag.issue,
        foundOn: snag.found_on,
        assignedTo: snag.assigned_to ?? "",
        fixBy: snag.fix_by ?? "",
        fixedOn: snag.fixed_on ?? "",
      }
    : undefined;

  async function handleSubmit(values: SnagInput) {
    const result = isEdit ? await updateSnag(snag!.id, values) : await createSnag(values);
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
                Add Snag
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit snag" : "Add a snag"}</DialogTitle>
        </DialogHeader>
        <SnagForm
          projectOptions={projectOptions}
          defaultValues={defaultValues}
          submitLabel={isEdit ? "Save changes" : "Add snag"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
