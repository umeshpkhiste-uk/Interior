"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeadStageBadge } from "./lead-stage-badge";
import { LeadFormDialog } from "./lead-form-dialog";
import { formatINR } from "@/lib/calculations/shared";
import type { LeadListItem } from "@/lib/data/leads";

export function LeadsTable({ leads }: { leads: LeadListItem[] }) {
  const [editingLead, setEditingLead] = useState<LeadListItem | null>(null);

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No leads found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead ID</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Next Follow-up</TableHead>
            <TableHead className="text-right">Days Old</TableHead>
            <TableHead className="text-right">Follow-ups</TableHead>
            <TableHead className="text-right">Last Quote</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              className="cursor-pointer"
              onClick={() => setEditingLead(lead)}
            >
              <TableCell className="font-medium">{lead.lead_code}</TableCell>
              <TableCell>{lead.client_name}</TableCell>
              <TableCell className="text-muted-foreground">{lead.area ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{lead.source.replace(/_/g, " ")}</TableCell>
              <TableCell className="text-muted-foreground">{lead.property_type ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {lead.budget != null ? formatINR(lead.budget) : "—"}
              </TableCell>
              <TableCell>
                <LeadStageBadge stage={lead.stage} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {lead.next_followup_date
                  ? new Date(`${lead.next_followup_date}T00:00:00`).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "—"}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{lead.daysOld}</TableCell>
              <TableCell className="text-right text-muted-foreground">{lead.followupCount}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {lead.lastQuoteAmount != null ? formatINR(lead.lastQuoteAmount) : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{lead.statusLabel}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editingLead && (
        <LeadFormDialog
          lead={editingLead}
          trigger={null}
          open={editingLead !== null}
          onOpenChange={(open) => !open && setEditingLead(null)}
        />
      )}
    </div>
  );
}
