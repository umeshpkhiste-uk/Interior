"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProjectCostForm, type ProjectCostFormInput } from "./project-cost-form";
import { addExpense } from "@/lib/actions/expenses";
import type { ProjectOption } from "@/lib/data/projects";

export function ProjectCostFormDialog({
  projectOptions,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  projectOptions: ProjectOption[];
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();

  async function handleSubmit(values: ProjectCostFormInput) {
    const { projectId, ...rest } = values;
    const result = await addExpense(projectId, rest);
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
                Add Cost
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a project cost</DialogTitle>
        </DialogHeader>
        <ProjectCostForm projectOptions={projectOptions} submitLabel="Add cost" onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
