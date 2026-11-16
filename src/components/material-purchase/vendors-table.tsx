"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VendorFormDialog } from "./vendor-form-dialog";
import { formatINR } from "@/lib/calculations/shared";
import type { VendorListItem } from "@/lib/data/vendors";

export function VendorsTable({ vendors }: { vendors: VendorListItem[] }) {
  const [editing, setEditing] = useState<VendorListItem | null>(null);

  if (vendors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No vendors added yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor ID</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">Credit Days</TableHead>
            <TableHead className="text-right">Purchases</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="text-right">Open POs</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((vendor) => (
            <TableRow key={vendor.id} className="cursor-pointer" onClick={() => setEditing(vendor)}>
              <TableCell className="font-medium">{vendor.vendor_code ?? "—"}</TableCell>
              <TableCell>{vendor.name}</TableCell>
              <TableCell className="text-muted-foreground">{vendor.category ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{vendor.address ?? "—"}</TableCell>
              <TableCell className="text-right text-muted-foreground">{vendor.credit_days}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(vendor.purchases)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(vendor.paid)}</TableCell>
              <TableCell className="text-right font-medium">{formatINR(vendor.balance)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{vendor.openPOs}</TableCell>
              <TableCell>
                <Badge variant={vendor.statusLabel === "To pay" ? "destructive" : "default"}>
                  {vendor.statusLabel}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing && (
        <VendorFormDialog
          vendor={editing}
          trigger={null}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}
