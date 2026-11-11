"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/calculations/shared";
import { ReviseRateDialog } from "./revise-rate-dialog";
import type { MaterialRateWithNames } from "@/lib/data/rates";

export function RatesTable({ rates }: { rates: MaterialRateWithNames[] }) {
  const [revising, setRevising] = useState<MaterialRateWithNames | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Current rate</TableHead>
            <TableHead>Last updated</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rates.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">
                {r.materialName} <span className="text-muted-foreground">({r.unit})</span>
              </TableCell>
              <TableCell className="text-muted-foreground">{r.supplierName ?? "—"}</TableCell>
              <TableCell>{formatINR(Number(r.current_rate))}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(r.last_updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => setRevising(r)}>
                  Revise
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {rates.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No rates yet. Add a material in the Material Library first, then add its rate here.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {revising && <ReviseRateDialog rate={revising} open={Boolean(revising)} onOpenChange={(o) => !o && setRevising(null)} />}
    </>
  );
}
