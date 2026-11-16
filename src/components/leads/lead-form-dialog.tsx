"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeadForm } from "./lead-form";
import { createLead, updateLead } from "@/lib/actions/leads";
import type { LeadInput } from "@/lib/validations/lead";
import type { LeadRow } from "@/lib/data/leads";

export function LeadFormDialog({
  lead,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  lead?: LeadRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(lead);

  const defaultValues: Partial<LeadInput> | undefined = lead
    ? {
        enquiryDate: lead.enquiry_date,
        clientName: lead.client_name,
        phone: lead.phone ?? "",
        area: lead.area ?? "",
        source: lead.source,
        propertyType: lead.property_type ?? "",
        budget: lead.budget ?? undefined,
        stage: lead.stage,
        nextFollowupDate: lead.next_followup_date ?? "",
        custom1: lead.custom_1 ?? "",
        custom2: lead.custom_2 ?? "",
        notes: lead.notes ?? "",
      }
    : undefined;

  async function handleSubmit(values: LeadInput) {
    const result = isEdit ? await updateLead(lead!.id, values) : await createLead(values);
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
                Add Lead
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit lead" : "Add a new lead"}</DialogTitle>
        </DialogHeader>
        <LeadForm
          defaultValues={defaultValues}
          submitLabel={isEdit ? "Save changes" : "Add lead"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
