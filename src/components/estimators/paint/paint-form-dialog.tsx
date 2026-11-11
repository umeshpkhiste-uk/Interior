"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PaintForm } from "./paint-form";
import { createPaintEstimation, updatePaintEstimation } from "@/lib/actions/paint";
import type { PaintEstimationInput } from "@/lib/validations/paint";
import type { PaintEstimationRow } from "@/lib/data/paint";
import type { RoomOption } from "@/lib/data/rooms";

export function PaintFormDialog({
  projectId,
  rooms,
  estimation,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  projectId: string;
  rooms: RoomOption[];
  estimation?: PaintEstimationRow;
  trigger?: React.ReactElement | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(estimation);

  const defaultValues: Partial<PaintEstimationInput> | undefined = estimation
    ? {
        roomId: estimation.room_id ?? "",
        netWallArea: Number(estimation.net_wall_area),
        ceilingArea: Number(estimation.ceiling_area),
        featureWallArea: Number(estimation.feature_wall_area),
        coats: estimation.coats,
        paintCoveragePerLitre: Number(estimation.paint_coverage_per_litre ?? 0),
        primerCoverage: Number(estimation.primer_coverage ?? 0),
        puttyCoverage: Number(estimation.putty_coverage ?? 0),
        canSize: Number(estimation.can_size ?? 0),
        paintRate: Number(estimation.paint_rate ?? 0),
        primerRate: Number(estimation.primer_rate ?? 0),
        puttyRate: Number(estimation.putty_rate ?? 0),
        labourRate: Number(estimation.labour_rate ?? 0),
        wallpaperRollLength: Number(estimation.wallpaper_roll_length ?? 0),
        wallpaperRollWidth: Number(estimation.wallpaper_roll_width ?? 0),
        wallpaperRate: Number(estimation.wallpaper_rate ?? 0),
        wallpaperFixingRate: Number(estimation.wallpaper_fixing_rate),
        wastagePct: Number(estimation.wastage_pct) * 100,
        paintBrand: estimation.paint_brand ?? "",
        finishType: estimation.finish_type ?? "",
        marginPct: Number(estimation.margin_pct) * 100,
        roundingUnit: Number(estimation.rounding_unit),
      }
    : undefined;

  async function handleSubmit(values: PaintEstimationInput) {
    const result = isEdit
      ? await updatePaintEstimation(estimation!.id, projectId, values)
      : await createPaintEstimation(projectId, values);
    if (!result.error) {
      setOpen(false);
      router.refresh();
    }
    return { error: result.error };
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger
          render={
            trigger ?? (
              <Button size="sm">
                <Plus className="size-4" />
                Add Paint Estimation
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit paint estimation" : "Add a paint estimation"}</DialogTitle>
        </DialogHeader>
        <PaintForm
          defaultValues={defaultValues}
          rooms={rooms}
          submitLabel={isEdit ? "Save changes" : "Add"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
