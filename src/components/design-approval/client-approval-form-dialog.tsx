"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClientApprovalForm } from "./client-approval-form";
import { createClientApproval, updateClientApproval } from "@/lib/actions/client-approvals";
import type { ClientApprovalInput } from "@/lib/validations/client-approval";
import type { ClientApprovalRow } from "@/lib/data/client-approvals";
import type { ProjectOption } from "@/lib/data/projects";

export function ClientApprovalFormDialog({
  projectOptions,
  approval,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  projectOptions: ProjectOption[];
  approval?: ClientApprovalRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(approval);

  const defaultValues: Partial<ClientApprovalInput> | undefined = approval
    ? {
        projectId: approval.project_id,
        approvalFor: approval.approval_for,
        roomArea: approval.room_area ?? "",
        sentOn: approval.sent_on,
        approvedOn: approval.approved_on ?? "",
        approvedBy: approval.approved_by ?? "",
        channel: approval.channel ?? undefined,
      }
    : undefined;

  async function handleSubmit(values: ClientApprovalInput) {
    const result = isEdit
      ? await updateClientApproval(approval!.id, values)
      : await createClientApproval(values);
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
                Add Approval
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit approval" : "Add a client approval"}</DialogTitle>
        </DialogHeader>
        <ClientApprovalForm
          projectOptions={projectOptions}
          defaultValues={defaultValues}
          submitLabel={isEdit ? "Save changes" : "Add approval"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
