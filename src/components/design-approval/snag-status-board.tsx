import { cn } from "@/lib/utils";
import type { DesignApprovalDashboard } from "@/lib/data/design-approval";

/** Room x status matrix; darker cells have more snags, same "heat" idea as the source sheet's snag status board. */
export function SnagStatusBoard({ board }: { board: DesignApprovalDashboard["snagStatusBoard"] }) {
  if (board.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No snags yet.</p>;
  }

  const max = Math.max(1, ...board.flatMap((row) => [row.overdue, row.dueSoon, row.open, row.fixed]));

  const columns: { key: "overdue" | "dueSoon" | "open" | "fixed"; label: string }[] = [
    { key: "overdue", label: "Overdue" },
    { key: "dueSoon", label: "Due soon" },
    { key: "open", label: "Open" },
    { key: "fixed", label: "Fixed" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left font-medium text-muted-foreground">Room / Area</th>
            {columns.map((col) => (
              <th key={col.key} className="px-2 py-1 text-center font-medium text-muted-foreground">
                {col.label}
              </th>
            ))}
            <th className="px-2 py-1 text-right font-medium text-muted-foreground">Total</th>
          </tr>
        </thead>
        <tbody>
          {board.map((row) => (
            <tr key={row.label}>
              <td className="px-2 py-1 font-medium">{row.label}</td>
              {columns.map((col) => {
                const count = row[col.key];
                const intensity = count / max;
                return (
                  <td key={col.key} className="px-2 py-1 text-center">
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
