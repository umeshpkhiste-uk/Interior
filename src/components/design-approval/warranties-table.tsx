"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { WarrantyFormDialog } from "./warranty-form-dialog";
import type { WarrantyListItem } from "@/lib/data/warranties";
import type { ProjectOption } from "@/lib/data/projects";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  "Under warranty": "default",
  "Ending soon": "secondary",
  Over: "outline",
};

export function WarrantiesTable({
  warranties,
  projectOptions,
}: {
  warranties: WarrantyListItem[];
  projectOptions: ProjectOption[];
}) {
  const [editing, setEditing] = useState<WarrantyListItem | null>(null);

  if (warranties.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No warranties registered yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Handover Date</TableHead>
            <TableHead className="text-right">Warranty (years)</TableHead>
            <TableHead>Valid Till</TableHead>
            <TableHead className="text-right">Days Left</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {warranties.map((warranty) => (
            <TableRow key={warranty.id} className="cursor-pointer" onClick={() => setEditing(warranty)}>
              <TableCell className="font-medium">{warranty.projectCode}</TableCell>
              <TableCell className="text-muted-foreground">{warranty.clientName}</TableCell>
              <TableCell>{warranty.item}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(`${warranty.handover_date}T00:00:00`).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{warranty.warranty_years}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(`${warranty.validTill}T00:00:00`).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{warranty.daysLeft}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[warranty.statusLabel] ?? "outline"}>{warranty.statusLabel}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing && (
        <WarrantyFormDialog
          projectOptions={projectOptions}
          warranty={editing}
          trigger={null}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}
