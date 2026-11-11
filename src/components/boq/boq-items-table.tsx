"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatINR } from "@/lib/calculations/shared";
import { BoqItemFormDialog } from "./boq-item-form-dialog";
import { deleteBoqItem } from "@/lib/actions/boq";
import type { BoqItemWithRoom, BoqItemRow } from "@/lib/data/boq";
import type { RoomOption } from "@/lib/data/rooms";

export function BoqItemsTable({
  projectId,
  items,
  rooms,
}: {
  projectId: string;
  items: BoqItemWithRoom[];
  rooms: RoomOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<BoqItemRow | null>(null);

  async function handleDelete(item: BoqItemWithRoom) {
    if (!window.confirm(`Delete "${item.item_description}"?`)) return;
    const result = await deleteBoqItem(item.id, projectId);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {item.item_description}
                {!item.is_manual && (
                  <Badge variant="outline" className="ml-2">
                    Synced
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{item.roomName ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{item.work_category ?? "—"}</TableCell>
              <TableCell>
                {Number(item.quantity)} {item.unit}
              </TableCell>
              <TableCell>{formatINR(Number(item.total_rate))}</TableCell>
              <TableCell className="font-medium">{formatINR(Number(item.amount))}</TableCell>
              <TableCell className="text-right">
                {item.is_manual && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" aria-label="Actions">
                          <MoreVertical className="size-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(item)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(item)} variant="destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No BOQ items yet. Sync from estimators or add a manual item.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <BoqItemFormDialog
        projectId={projectId}
        rooms={rooms}
        item={editing ?? undefined}
        trigger={null}
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
}
