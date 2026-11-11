"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteQuotationDraft, sendQuotation, setQuotationStatus } from "@/lib/actions/quotations";
import type { QuotationRow } from "@/lib/data/quotations";

export function QuotationActions({ quotation, projectId }: { quotation: QuotationRow; projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<{ error: string | null }>, successMessage: string) {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success(successMessage);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" render={<a href={`/api/quotations/${quotation.id}/pdf`} target="_blank" rel="noopener noreferrer" />}>
        <Download className="size-3.5" />
        Download PDF
      </Button>
      {quotation.status === "draft" && (
        <>
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => run(() => sendQuotation(quotation.id, projectId), "Quotation sent — rates are now locked")}
          >
            <Send className="size-3.5" />
            Send to client
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => {
              if (window.confirm("Delete this draft quotation?")) {
                run(() => deleteQuotationDraft(quotation.id, projectId), "Draft deleted").then(() => router.push(`/projects/${projectId}`));
              }
            }}
          >
            Delete draft
          </Button>
        </>
      )}
      {(quotation.status === "sent" || quotation.status === "viewed") && (
        <>
          <Button type="button" size="sm" disabled={busy} onClick={() => run(() => setQuotationStatus(quotation.id, projectId, "approved"), "Marked as approved")}>
            Mark approved
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => run(() => setQuotationStatus(quotation.id, projectId, "rejected"), "Marked as rejected")}>
            Mark rejected
          </Button>
        </>
      )}
    </div>
  );
}
