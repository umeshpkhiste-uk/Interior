"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PurchaseOrderFormDialog } from "./purchase-order-form-dialog";
import { formatINR } from "@/lib/calculations/shared";
import type { PurchaseOrderListItem } from "@/lib/data/purchase-orders";
import type { VendorOption } from "@/lib/data/vendors";
import type { ProjectOption } from "@/lib/data/projects";

export function PurchaseOrdersTable({
  orders,
  vendorOptions,
  projectOptions,
}: {
  orders: PurchaseOrderListItem[];
  vendorOptions: VendorOption[];
  projectOptions: ProjectOption[];
}) {
  const [editing, setEditing] = useState<PurchaseOrderListItem | null>(null);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No purchase orders logged yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO No.</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Delivery</TableHead>
            <TableHead>Pay By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="cursor-pointer" onClick={() => setEditing(order)}>
              <TableCell className="font-medium">{order.po_number}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(`${order.order_date}T00:00:00`).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </TableCell>
              <TableCell>{order.vendorName}</TableCell>
              <TableCell className="text-muted-foreground">{order.projectCode ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {order.item} ({order.unit})
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{order.qty}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatINR(order.rate)}</TableCell>
              <TableCell className="text-right font-medium">{formatINR(order.amount)}</TableCell>
              <TableCell>
                <Badge variant={order.delivery_status === "delivered" ? "default" : "secondary"}>
                  {order.delivery_status === "delivered" ? "Delivered" : "Pending"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(`${order.payBy}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editing && (
        <PurchaseOrderFormDialog
          vendorOptions={vendorOptions}
          projectOptions={projectOptions}
          order={editing}
          trigger={null}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </div>
  );
}
