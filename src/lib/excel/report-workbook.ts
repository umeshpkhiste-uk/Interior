import ExcelJS from "exceljs";
import type { ReportTable } from "@/lib/reports/types";

export async function buildReportWorkbook(report: ReportTable): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = report.header.organizationName;
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(report.title.slice(0, 31));

  sheet.addRow([report.header.organizationName]).font = { bold: true, size: 14 };
  if (report.header.organizationAddress) sheet.addRow([report.header.organizationAddress]);
  if (report.header.organizationGstin) sheet.addRow([`GSTIN: ${report.header.organizationGstin}`]);
  sheet.addRow([report.title]).font = { bold: true, size: 12 };
  if (report.header.projectName) sheet.addRow([`Project: ${report.header.projectName}`]);
  if (report.header.clientName) sheet.addRow([`Client: ${report.header.clientName}`]);
  sheet.addRow([`Generated: ${report.header.generatedAt}`]);
  sheet.addRow([]);

  const headerRow = sheet.addRow(report.columns.map((c) => c.label));
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F3F3" } };
  });

  for (const row of report.rows) {
    const excelRow = sheet.addRow(report.columns.map((c) => row[c.key] ?? "—"));
    report.columns.forEach((col, i) => {
      if (col.align === "right") excelRow.getCell(i + 1).alignment = { horizontal: "right" };
    });
  }

  if (report.totals && report.totals.length > 0) {
    sheet.addRow([]);
    for (const total of report.totals) {
      const row = sheet.addRow([total.label, total.value]);
      row.font = { bold: true };
    }
  }

  sheet.columns.forEach((col) => {
    col.width = 22;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
