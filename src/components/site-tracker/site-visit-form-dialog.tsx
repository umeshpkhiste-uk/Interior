"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SiteVisitForm } from "./site-visit-form";
import { createSiteVisit, updateSiteVisit } from "@/lib/actions/site-visits";
import type { SiteVisitInput } from "@/lib/validations/site-visit";
import type { SiteVisitRow } from "@/lib/data/site-visits";
import type { ProjectOption } from "@/lib/data/projects";

export function SiteVisitFormDialog({
  projectOptions,
  visit,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  projectOptions: ProjectOption[];
  visit?: SiteVisitRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(visit);

  const defaultValues: Partial<SiteVisitInput> | undefined = visit
    ? {
        projectId: visit.project_id,
        visitDate: visit.visit_date,
        visitedBy: visit.visited_by ?? "",
        purpose: visit.purpose ?? "",
        workDonePct: visit.work_done_pct != null ? visit.work_done_pct * 100 : undefined,
        notes: visit.notes ?? "",
        nextVisitInDays: visit.next_visit_in_days ?? undefined,
      }
    : undefined;

  async function handleSubmit(values: SiteVisitInput) {
    const result = isEdit ? await updateSiteVisit(visit!.id, values) : await createSiteVisit(values);
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
                Log Visit
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit visit" : "Log a site visit"}</DialogTitle>
        </DialogHeader>
        <SiteVisitForm
          projectOptions={projectOptions}
          defaultValues={defaultValues}
          submitLabel={isEdit ? "Save changes" : "Log visit"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
