"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProjectForm } from "./project-form";
import { createProject, updateProject } from "@/lib/actions/projects";
import type { ProjectInput } from "@/lib/validations/project";
import type { ClientOption, DesignerOption, ProjectRow } from "@/lib/data/projects";

export function ProjectFormDialog({
  project,
  clients,
  designers,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  project?: ProjectRow;
  clients: ClientOption[];
  designers: DesignerOption[];
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(project);

  const defaultValues: Partial<ProjectInput> | undefined = project
    ? {
        clientId: project.client_id,
        name: project.name,
        propertyAddress: project.property_address ?? "",
        propertyType: project.property_type ?? undefined,
        bedrooms: project.bedrooms ?? undefined,
        bathrooms: project.bathrooms ?? undefined,
        carpetArea: project.carpet_area ?? undefined,
        builtUpArea: project.built_up_area ?? undefined,
        startDate: project.start_date ?? "",
        expectedCompletionDate: project.expected_completion_date ?? "",
        status: project.status,
        description: project.description ?? "",
        assignedDesignerId: project.assigned_designer_id ?? "",
      }
    : undefined;

  async function handleSubmit(values: ProjectInput) {
    const result = isEdit
      ? await updateProject(project!.id, values)
      : await createProject(values);
    if (!result.error) {
      setOpen(false);
      router.refresh();
      if (!isEdit && result.data) {
        router.push(`/projects/${result.data.id}`);
      }
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
                New Project
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "Create a new project"}</DialogTitle>
        </DialogHeader>
        <ProjectForm
          clients={clients}
          designers={designers}
          defaultValues={defaultValues}
          submitLabel={isEdit ? "Save changes" : "Create project"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
