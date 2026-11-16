"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DesignRevisionForm } from "./design-revision-form";
import { createDesignRevision, updateDesignRevision } from "@/lib/actions/design-revisions";
import type { DesignRevisionInput } from "@/lib/validations/design-revision";
import type { DesignRevisionRow } from "@/lib/data/design-revisions";
import type { ProjectOption } from "@/lib/data/projects";

export function DesignRevisionFormDialog({
  projectOptions,
  revision,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  projectOptions: ProjectOption[];
  revision?: DesignRevisionRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(revision);

  const defaultValues: Partial<DesignRevisionInput> | undefined = revision
    ? {
        projectId: revision.project_id,
        roomArea: revision.room_area ?? "",
        drawing: revision.drawing,
        version: revision.version,
        clientAskedFor: revision.client_asked_for ?? "",
        sentOn: revision.sent_on,
        replyOn: revision.reply_on ?? "",
        replyStatus: revision.reply_status,
      }
    : undefined;

  async function handleSubmit(values: DesignRevisionInput) {
    const result = isEdit
      ? await updateDesignRevision(revision!.id, values)
      : await createDesignRevision(values);
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
                Add Revision
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit revision" : "Add a design revision"}</DialogTitle>
        </DialogHeader>
        <DesignRevisionForm
          projectOptions={projectOptions}
          defaultValues={defaultValues}
          submitLabel={isEdit ? "Save changes" : "Add revision"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
