"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FollowupForm } from "./followup-form";
import { createLeadFollowup } from "@/lib/actions/lead-followups";
import type { LeadFollowupInput } from "@/lib/validations/lead-followup";
import type { LeadOption } from "@/lib/data/leads";

export function FollowupFormDialog({ leadOptions }: { leadOptions: LeadOption[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleSubmit(values: LeadFollowupInput) {
    const result = await createLeadFollowup(values);
    if (!result.error) {
      setOpen(false);
      router.refresh();
    }
    return { error: result.error };
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="size-4" />
            Log Follow-up
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log a follow-up</DialogTitle>
        </DialogHeader>
        <FollowupForm leadOptions={leadOptions} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
