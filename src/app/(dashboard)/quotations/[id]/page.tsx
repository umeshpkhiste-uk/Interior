import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { getQuotationById } from "@/lib/data/quotations";
import { getProjectById } from "@/lib/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuotationStatusBadge } from "@/components/quotations/quotation-status-badge";
import { QuotationActions } from "@/components/quotations/quotation-actions";
import { QuotationSettingsForm } from "@/components/quotations/quotation-settings-form";
import { QuotationItemsManager } from "@/components/quotations/quotation-items-manager";
import { PaymentStagesManager } from "@/components/quotations/payment-stages-manager";
import { QuotationTotalsSummary } from "@/components/quotations/quotation-totals-summary";

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireCurrentUserContext();
  const quotation = await getQuotationById(ctx.organizationId, id);
  if (!quotation) notFound();

  const project = await getProjectById(ctx.organizationId, quotation.project_id);
  const editable = quotation.status === "draft";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link href={`/projects/${quotation.project_id}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Back to project
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{quotation.quotation_number}</h1>
            <QuotationStatusBadge status={quotation.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {project?.name} · {project?.clientName}
          </p>
        </div>
        <QuotationActions quotation={quotation} projectId={quotation.project_id} />
      </div>

      <QuotationTotalsSummary quotation={quotation} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Validity, discount & GST</CardTitle>
        </CardHeader>
        <CardContent>
          <QuotationSettingsForm quotation={quotation} projectId={quotation.project_id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Additional items (outside the BOQ)</CardTitle>
        </CardHeader>
        <CardContent>
          <QuotationItemsManager quotationId={quotation.id} projectId={quotation.project_id} items={quotation.items} editable={editable} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Payment schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentStagesManager
            quotationId={quotation.id}
            projectId={quotation.project_id}
            stages={quotation.paymentStages}
            editable={editable}
          />
        </CardContent>
      </Card>

      {!editable && (
        <p className="text-xs text-muted-foreground">
          This quotation was sent on {quotation.sent_at ? new Date(quotation.sent_at).toLocaleString("en-IN") : "—"}. Its
          rates and totals are now frozen in an immutable snapshot and won&apos;t change even if BOQ rates are edited later.
        </p>
      )}
    </div>
  );
}
