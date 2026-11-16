"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MaterialIssueForm } from "./material-issue-form";
import { createMaterialIssue, updateMaterialIssue } from "@/lib/actions/material-issues";
import type { MaterialIssueInput } from "@/lib/validations/material-issue";
import type { MaterialIssueRow } from "@/lib/data/material-issues";
import type { ProjectOption } from "@/lib/data/projects";
import type { PurchaseOrderOption } from "@/lib/data/purchase-orders";

export function MaterialIssueFormDialog({
  projectOptions,
  purchaseOrderOptions,
  issue,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  projectOptions: ProjectOption[];
  purchaseOrderOptions: PurchaseOrderOption[];
  issue?: MaterialIssueRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(issue);

  const defaultValues: Partial<MaterialIssueInput> | undefined = issue
    ? {
        projectId: issue.project_id,
        purchaseOrderId: issue.purchase_order_id ?? "",
        issueDate: issue.issue_date,
        item: issue.item,
        unit: issue.unit,
        qty: issue.qty,
        rate: issue.rate,
        issuedTo: issue.issued_to ?? "",
      }
    : undefined;

  async function handleSubmit(values: MaterialIssueInput) {
    const result = isEdit
      ? await updateMaterialIssue(issue!.id, values)
      : await createMaterialIssue(values);
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
                Issue Material
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit material issue" : "Issue material to site"}</DialogTitle>
        </DialogHeader>
        <MaterialIssueForm
          projectOptions={projectOptions}
          purchaseOrderOptions={purchaseOrderOptions}
          defaultValues={defaultValues}
          submitLabel={isEdit ? "Save changes" : "Issue material"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
