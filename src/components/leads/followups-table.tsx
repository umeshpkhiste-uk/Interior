import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LEAD_FOLLOWUP_CHANNEL_LABELS } from "@/lib/validations/lead-followup";
import { LEAD_STAGE_LABELS } from "@/lib/validations/lead";
import type { LeadFollowupListItem } from "@/lib/data/lead-followups";

export function FollowupsTable({ followups }: { followups: LeadFollowupListItem[] }) {
  if (followups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No follow-ups logged yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Lead ID</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>How</TableHead>
            <TableHead>By</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead>Lead Stage Then</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {followups.map((followup) => (
            <TableRow key={followup.id}>
              <TableCell className="text-muted-foreground">
                {new Date(`${followup.followup_date}T00:00:00`).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </TableCell>
              <TableCell className="font-medium">{followup.leadCode}</TableCell>
              <TableCell>{followup.clientName}</TableCell>
              <TableCell className="text-muted-foreground">
                {LEAD_FOLLOWUP_CHANNEL_LABELS[followup.channel]}
              </TableCell>
              <TableCell className="text-muted-foreground">{followup.handled_by ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{followup.outcome ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {followup.stage_snapshot ? LEAD_STAGE_LABELS[followup.stage_snapshot] : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
