import { cn } from "@/lib/utils";
import { LEAD_STAGES, LEAD_STAGE_LABELS } from "@/lib/validations/lead";
import type { LeadDashboard } from "@/lib/data/leads";

/** Source x stage matrix; darker cells have more leads, same "heat" idea as the source sheet's pipeline board. */
export function LeadPipelineBoard({ pipeline }: { pipeline: LeadDashboard["pipeline"] }) {
  if (pipeline.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No leads yet.</p>;
  }

  const max = Math.max(1, ...pipeline.flatMap((row) => Object.values(row.byStage)));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left font-medium text-muted-foreground">Source</th>
            {LEAD_STAGES.map((stage) => (
              <th key={stage} className="px-2 py-1 text-center font-medium text-muted-foreground">
                {LEAD_STAGE_LABELS[stage]}
              </th>
            ))}
            <th className="px-2 py-1 text-right font-medium text-muted-foreground">Total</th>
          </tr>
        </thead>
        <tbody>
          {pipeline.map((row) => (
            <tr key={row.source}>
              <td className="px-2 py-1 font-medium">{row.label}</td>
              {LEAD_STAGES.map((stage) => {
                const count = row.byStage[stage] ?? 0;
                const intensity = count / max;
                return (
                  <td key={stage} className="px-2 py-1 text-center">
                    <div
                      className={cn(
                        "mx-auto flex size-8 items-center justify-center rounded-md text-xs font-medium",
                        count === 0 ? "bg-muted text-muted-foreground" : "text-primary-foreground"
                      )}
                      style={count > 0 ? { backgroundColor: `oklch(0.55 0.1 250 / ${0.25 + intensity * 0.75})` } : undefined}
                    >
                      {count || ""}
                    </div>
                  </td>
                );
              })}
              <td className="px-2 py-1 text-right font-semibold">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
