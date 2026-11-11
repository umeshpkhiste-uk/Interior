import Link from "next/link";
import { BarChart3, FileText, FileSpreadsheet } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listProjects } from "@/lib/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ReportsPage() {
  const ctx = await requireCurrentUserContext();
  const projects = await listProjects(ctx.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Downloadable PDF and Excel reports. Pick a project for its cost, BOQ, profitability, quotation, and
          expense reports.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Business-wide reports</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Rate Revision Report (all projects)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" render={<a href="/api/reports/rate-revision/pdf" target="_blank" rel="noopener noreferrer" />}>
              <FileText className="size-3.5" />
              PDF
            </Button>
            <Button variant="outline" size="sm" render={<a href="/api/reports/rate-revision/excel" target="_blank" rel="noopener noreferrer" />}>
              <FileSpreadsheet className="size-3.5" />
              Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <BarChart3 className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No projects yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex flex-col gap-1 py-4">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.project_code} · {p.clientName}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
