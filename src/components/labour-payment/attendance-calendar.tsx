import { cn } from "@/lib/utils";
import type { LabourPaymentDashboard } from "@/lib/data/labour-payment";

/** Worker x last-14-days grid: 1 = full day, 0.5 = half day, P = piece work only, blank = absent/not marked. */
export function AttendanceCalendar({ calendar }: { calendar: LabourPaymentDashboard["attendanceCalendar"] }) {
  if (calendar.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No workers added yet.</p>;
  }

  const days = calendar[0]?.days ?? [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left font-medium text-muted-foreground">Worker</th>
            {days.map((day) => (
              <th key={day.date} className="px-1 py-1 text-center text-xs font-medium text-muted-foreground">
                {new Date(`${day.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric" })}
              </th>
            ))}
            <th className="px-2 py-1 text-right font-medium text-muted-foreground">Total</th>
          </tr>
        </thead>
        <tbody>
          {calendar.map((row) => (
            <tr key={row.worker}>
              <td className="px-2 py-1 font-medium">{row.worker}</td>
              {row.days.map((day) => (
                <td key={day.date} className="px-1 py-1 text-center">
                  <div
                    className={cn(
                      "mx-auto flex size-7 items-center justify-center rounded-md text-xs font-medium",
                      day.value === 0 ? "bg-muted text-muted-foreground" : "text-primary-foreground"
                    )}
                    style={
                      day.value !== 0
                        ? { backgroundColor: `oklch(0.55 0.1 250 / ${day.value === "P" ? 0.5 : 0.25 + Number(day.value) * 0.75})` }
                        : undefined
                    }
                  >
                    {day.value === 0 ? "" : day.value}
                  </div>
                </td>
              ))}
              <td className="px-2 py-1 text-right font-semibold">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
