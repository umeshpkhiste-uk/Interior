import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/calculations/shared";
import { computeHeadProfitability, computeProjectProfitability, otherHeadQuotedPrice } from "@/lib/calculations/profitability";
import { getProfitabilityRawData } from "@/lib/data/profitability";
import { ProjectSettingsForm } from "./project-settings-form";

const HEAD_LABELS: Record<string, string> = {
  kitchen: "Modular Kitchen",
  wardrobe: "Wardrobe",
  plywood: "Plywood & Laminate",
  ceiling: "False Ceiling",
  paint: "Paint & Wallpaper",
  flooring: "Flooring",
  electrical: "Electrical & Lighting",
};

export async function ProfitabilityPanel({ organizationId, projectId }: { organizationId: string; projectId: string }) {
  const raw = await getProfitabilityRawData(organizationId, projectId);
  const overheadPct = Number(raw.settings?.overhead_pct ?? 0);
  const targetMarginPct = Number(raw.settings?.target_margin_pct ?? 0.2);

  const namedHeads = Object.entries(raw.heads).map(([key, totals]) =>
    computeHeadProfitability({ name: HEAD_LABELS[key], ...totals }, overheadPct, targetMarginPct)
  );
  const namedHeadsQuotedTotal = namedHeads.reduce((s, h) => s + h.quotedPrice, 0);
  const otherHead = computeHeadProfitability(
    {
      name: "Other Carpentry & Furniture",
      material: Number(raw.settings?.other_head_material_cost ?? 0),
      labour: Number(raw.settings?.other_head_labour_cost ?? 0),
      quotedPrice: otherHeadQuotedPrice(raw.boqSubtotal, namedHeadsQuotedTotal),
    },
    overheadPct,
    targetMarginPct
  );
  const heads = [...namedHeads, otherHead];

  const project = computeProjectProfitability({
    heads,
    supervisorMonthlyCost: Number(raw.settings?.supervisor_monthly_cost ?? 0),
    projectDurationMonths: Number(raw.settings?.project_duration_months ?? 0),
    contingencyAndExtras: raw.contingencyAndExtras,
    discountAmount: raw.discountAmount,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total cost" value={formatINR(project.totalCost)} />
        <Stat label="Total quoted" value={formatINR(project.totalQuoted)} />
        <Stat label="Actual profit" value={formatINR(project.actualProfit)} highlight />
        <Stat label="Margin %" value={`${(project.actualMarginPct * 100).toFixed(1)}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Profitability settings</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectSettingsForm projectId={projectId} settings={raw.settings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Material vs Labour by work head</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Head</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Labour</TableHead>
                <TableHead>Overhead</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Quoted</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {heads.map((h) => (
                <TableRow key={h.name}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>{formatINR(h.material)}</TableCell>
                  <TableCell>{formatINR(h.labour)}</TableCell>
                  <TableCell>{formatINR(h.overhead)}</TableCell>
                  <TableCell>{formatINR(h.cost)}</TableCell>
                  <TableCell>{formatINR(h.quotedPrice)}</TableCell>
                  <TableCell>
                    {formatINR(h.margin)} ({(h.marginPct * 100).toFixed(1)}%)
                  </TableCell>
                  <TableCell>
                    <Badge variant={h.belowTarget ? "destructive" : "secondary"}>{h.belowTarget ? "Below target" : "OK"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Project-wide totals</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <DetailRow label="Total material" value={formatINR(project.totalMaterial)} />
          <DetailRow label="Total labour" value={formatINR(project.totalLabour)} />
          <DetailRow label="Total overhead" value={formatINR(project.totalOverhead)} />
          <DetailRow label="Supervision" value={formatINR(project.supervision)} />
          <DetailRow label="Contingency & extras" value={formatINR(raw.contingencyAndExtras)} />
          <DetailRow label="Discount" value={`-${formatINR(raw.discountAmount)}`} />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 ${highlight ? "border-primary bg-primary/5" : ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-lg font-semibold">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
