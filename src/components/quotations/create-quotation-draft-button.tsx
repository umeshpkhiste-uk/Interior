"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createQuotationDraft } from "@/lib/actions/quotations";

export function CreateQuotationDraftButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setCreating(true);
    const result = await createQuotationDraft(projectId);
    setCreating(false);
    if (result.error || !result.data) {
      toast.error(result.error ?? "Could not create quotation");
      return;
    }
    router.push(`/quotations/${result.data.id}`);
  }

  return (
    <Button type="button" size="sm" onClick={handleCreate} disabled={creating}>
      <Plus className="size-4" />
      {creating ? "Creating..." : "New Quotation"}
    </Button>
  );
}
