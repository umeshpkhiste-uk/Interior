import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { getProjectById } from "@/lib/data/projects";
import { ReportDocument } from "@/lib/pdf/report-document";
import { buildReportWorkbook } from "@/lib/excel/report-workbook";
import {
  buildProjectCostReport,
  buildRoomWiseCostReport,
  buildMaterialRequirementReport,
  buildBoqReport,
  buildProfitabilityReport,
  buildMaterialVsLabourReport,
  buildPackageComparisonReport,
  buildExpenseReport,
} from "@/lib/reports/builders";
import type { ReportTable } from "@/lib/reports/types";

const BUILDERS: Record<string, (organizationId: string, projectId: string, carpetArea: number | null) => Promise<ReportTable>> = {
  "project-cost": (org, projectId) => buildProjectCostReport(org, projectId),
  "room-wise-cost": (org, projectId) => buildRoomWiseCostReport(org, projectId),
  "material-requirement": (org, projectId) => buildMaterialRequirementReport(org, projectId),
  boq: (org, projectId) => buildBoqReport(org, projectId),
  profitability: (org, projectId) => buildProfitabilityReport(org, projectId),
  "material-vs-labour": (org, projectId) => buildMaterialVsLabourReport(org, projectId),
  "package-comparison": (org, projectId, carpetArea) => buildPackageComparisonReport(org, projectId, carpetArea),
  expense: (org, projectId) => buildExpenseReport(org, projectId),
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; projectId: string; format: string }> }
) {
  const { type, projectId, format } = await params;
  const builder = BUILDERS[type];
  if (!builder) return NextResponse.json({ error: "Unknown report type" }, { status: 404 });
  if (format !== "pdf" && format !== "excel") return NextResponse.json({ error: "Unknown format" }, { status: 400 });

  const ctx = await requireCurrentUserContext();
  const project = await getProjectById(ctx.organizationId, projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const report = await builder(ctx.organizationId, projectId, project.carpet_area);
  const filenameBase = `${type}-${project.project_code}`.replace(/[^a-zA-Z0-9-]/g, "_");

  if (format === "pdf") {
    const buffer = await renderToBuffer(<ReportDocument report={report} />);
    return new NextResponse(new Uint8Array(buffer), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${filenameBase}.pdf"` },
    });
  }

  const buffer = await buildReportWorkbook(report);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filenameBase}.xlsx"`,
    },
  });
}
