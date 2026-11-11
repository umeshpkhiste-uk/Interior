"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Paintbrush, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatINR } from "@/lib/calculations/shared";
import { PaintFormDialog } from "./paint-form-dialog";
import { deletePaintEstimation } from "@/lib/actions/paint";
import type { PaintEstimationRow } from "@/lib/data/paint";
import type { RoomOption } from "@/lib/data/rooms";

export function PaintPanel({
  projectId,
  estimations,
  rooms,
}: {
  projectId: string;
  estimations: PaintEstimationRow[];
  rooms: RoomOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<PaintEstimationRow | null>(null);
  const total = estimations.reduce((sum, e) => sum + Number(e.selling_price), 0);

  async function handleDelete(e: PaintEstimationRow) {
    if (!window.confirm("Delete this paint estimation?")) return;
    const result = await deletePaintEstimation(e.id, projectId);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-md border px-3 py-2">
          <p className="text-xs text-muted-foreground">Total paint & wallpaper price</p>
          <p className="font-heading text-lg font-semibold">{formatINR(total)}</p>
        </div>
        <PaintFormDialog projectId={projectId} rooms={rooms} />
      </div>

      {estimations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Paintbrush className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No paint estimations yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {estimations.map((e) => {
            const roomName = rooms.find((r) => r.id === e.room_id)?.name ?? "Whole project";
            return (
              <Card key={e.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle>{roomName}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {e.coats} coats
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" aria-label="Actions">
                          <MoreVertical className="size-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(e)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(e)} variant="destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Material cost" value={formatINR(Number(e.material_cost))} />
                  <Stat label="Labour cost" value={formatINR(Number(e.labour_cost))} />
                  <Stat label="Total cost" value={formatINR(Number(e.total_cost))} />
                  <Stat label="Selling price" value={formatINR(Number(e.selling_price))} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PaintFormDialog
        projectId={projectId}
        rooms={rooms}
        estimation={editing ?? undefined}
        trigger={null}
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 px-2 py-1.5">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
