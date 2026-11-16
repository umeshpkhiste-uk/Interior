"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QuotationForm } from "./quotation-form";
import { createLeadQuotation } from "@/lib/actions/lead-quotations";
import type { LeadQuotationInput } from "@/lib/validations/lead-quotation";
import type { LeadOption } from "@/lib/data/leads";

export function QuotationFormDialog({ leadOptions }: { leadOptions: LeadOption[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function handleSubmit(values: LeadQuotationInput) {
    const result = await createLeadQuotation(values);
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
            Add Quotation
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a quotation</DialogTitle>
        </DialogHeader>
        <QuotationForm leadOptions={leadOptions} onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
