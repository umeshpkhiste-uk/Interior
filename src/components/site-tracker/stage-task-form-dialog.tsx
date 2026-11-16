"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StageTaskForm } from "./stage-task-form";
import { createStageTask, updateStageTask } from "@/lib/actions/stage-tasks";
import type { StageTaskInput } from "@/lib/validations/stage-task";
import type { StageTaskRow } from "@/lib/data/stage-tasks";
import type { ProjectOption } from "@/lib/data/projects";

export function StageTaskFormDialog({
  projectOptions,
  task,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  projectOptions: ProjectOption[];
  task?: StageTaskRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(task);

  const defaultValues: Partial<StageTaskInput> | undefined = task
    ? {
        projectId: task.project_id,
        stage: task.stage,
        task: task.task,
        doneBy: task.done_by ?? "",
        plannedDate: task.planned_date ?? "",
        doneOn: task.done_on ?? "",
      }
    : undefined;

  async function handleSubmit(values: StageTaskInput) {
    const result = isEdit ? await updateStageTask(task!.id, values) : await createStageTask(values);
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
                Add Task
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "Add a stage task"}</DialogTitle>
        </DialogHeader>
        <StageTaskForm
          projectOptions={projectOptions}
          defaultValues={defaultValues}
          submitLabel={isEdit ? "Save changes" : "Add task"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
