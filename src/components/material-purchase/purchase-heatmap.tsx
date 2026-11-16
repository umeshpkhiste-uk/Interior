import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/calculations/shared";
import type { MaterialPurchaseDashboard } from "@/lib/data/material-purchase";

const MAX_PROJECT_COLUMNS = 6;

/** Category x project matrix; darker cells have more ordered value, same "heat" idea as the source sheet. */
export function PurchaseHeatmap({ heatmap }: { heatmap: MaterialPurchaseDashboard["heatmap"] }) {
  if (heatmap.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No purchases yet.</p>;
  }

  const totalsByProject = new Map<string, number>();
  for (const row of heatmap) {
    for (const [project, value] of Object.entries(row.byProject)) {
      totalsByProject.set(project, (totalsByProject.get(project) ?? 0) + value);
    }
  }
  const projects = [...totalsByProject.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_PROJECT_COLUMNS)
    .map(([project]) => project);

  const max = Math.max(1, ...heatmap.flatMap((row) => projects.map((p) => row.byProject[p] ?? 0)));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left font-medium text-muted-foreground">Category</th>
            {projects.map((project) => (
              <th key={project} className="px-2 py-1 text-center font-medium text-muted-foreground">
                {project}
              </th>
            ))}
            <th className="px-2 py-1 text-right font-medium text-muted-foreground">Total</th>
          </tr>
        </thead>
        <tbody>
          {heatmap.map((row) => (
            <tr key={row.category}>
              <td className="px-2 py-1 font-medium">{row.category}</td>
              {projects.map((project) => {
                const value = row.byProject[project] ?? 0;
                const intensity = value / max;
                return (
                  <td key={project} className="px-2 py-1 text-center">
                    <div
                      className={cn(
                        "mx-auto flex min-w-16 items-center justify-center rounded-md px-1.5 py-1 text-xs font-medium",
                        value === 0 ? "bg-muted text-muted-foreground" : "text-primary-foreground"
                      )}
                      style={value > 0 ? { backgroundColor: `oklch(0.55 0.1 250 / ${0.25 + intensity * 0.75})` } : undefined}
                    >
                      {value > 0 ? formatINR(value) : ""}
                    </div>
                  </td>
                );
              })}
              <td className="px-2 py-1 text-right font-semibold">{formatINR(row.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
