export interface ReportHeader {
  organizationName: string;
  organizationAddress: string | null;
  organizationGstin: string | null;
  projectName: string | null;
  clientName: string | null;
  generatedAt: string;
}

export interface ReportColumn {
  key: string;
  label: string;
  align?: "left" | "right";
}

export interface ReportTotal {
  label: string;
  value: string;
}

/** Row values are pre-formatted display strings — both PDF and Excel render them as given. */
export interface ReportTable {
  title: string;
  header: ReportHeader;
  columns: ReportColumn[];
  rows: Record<string, string>[];
  totals?: ReportTotal[];
}
