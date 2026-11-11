import { FileText, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listQuotations } from "@/lib/data/quotations";

const PROJECT_REPORTS: { type: string; label: string }[] = [
  { type: "project-cost", label: "Project Cost Report" },
  { type: "room-wise-cost", label: "Room-wise Cost Report" },
  { type: "material-requirement", label: "Material Requirement Report" },
  { type: "boq", label: "BOQ Report" },
  { type: "profitability", label: "Profitability Report" },
  { type: "material-vs-labour", label: "Material vs Labour Report" },
  { type: "package-comparison", label: "Package Comparison Report" },
  { type: "expense", label: "Expense Report" },
];

export async function ReportsPanel({ organizationId, projectId }: { organizationId: string; projectId: string }) {
  const quotations = await listQuotations(organizationId, projectId);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Project reports</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {PROJECT_REPORTS.map((report) => (
            <ReportRow key={report.type} label={report.label} pdfHref={`/api/reports/${report.type}/${projectId}/pdf`} excelHref={`/api/reports/${report.type}/${projectId}/excel`} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Client quotation reports</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {quotations.length === 0 && <p className="py-4 text-sm text-muted-foreground">No quotations created yet.</p>}
          {quotations.map((q) => (
            <ReportRow
              key={q.id}
              label={q.quotation_number}
              pdfHref={`/api/reports/quotation/${q.id}/pdf`}
              excelHref={`/api/reports/quotation/${q.id}/excel`}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Business-wide reports</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          <ReportRow label="Rate Revision Report (all projects)" pdfHref="/api/reports/rate-revision/pdf" excelHref="/api/reports/rate-revision/excel" />
        </CardContent>
      </Card>
    </div>
  );
}

function ReportRow({ label, pdfHref, excelHref }: { label: string; pdfHref: string; excelHref: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" render={<a href={pdfHref} target="_blank" rel="noopener noreferrer" />}>
          <FileText className="size-3.5" />
          PDF
        </Button>
        <Button variant="outline" size="sm" render={<a href={excelHref} target="_blank" rel="noopener noreferrer" />}>
          <FileSpreadsheet className="size-3.5" />
          Excel
        </Button>
      </div>
    </div>
  );
}
