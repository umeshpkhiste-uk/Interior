"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/shared/field";
import { applyRateRevision } from "@/lib/actions/rates";
import { computeNewRate, estimatedMonthlyImpact, marketStatus } from "@/lib/calculations/rate-revision";
import { formatINR } from "@/lib/calculations/shared";
import { reviseRateSchema, type ReviseRateInput } from "@/lib/validations/rates";
import type { MaterialRateWithNames } from "@/lib/data/rates";

const MARKET_STATUS_LABELS = {
  below_market: "Below market",
  within_market: "Within market",
  above_market: "Above market",
  unknown: "No market range set",
};

export function ReviseRateDialog({
  rate,
  open,
  onOpenChange,
}: {
  rate: MaterialRateWithNames;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const suggested = computeNewRate(Number(rate.current_rate), Number(rate.planned_increase_pct), Number(rate.round_step));
  const { register, watch, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ReviseRateInput>({
    resolver: zodResolver(reviseRateSchema),
    defaultValues: { newRate: suggested, reason: "" },
  });
  useEffect(() => {
    if (open) reset({ newRate: suggested, reason: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const newRate = watch("newRate");
  const impact = estimatedMonthlyImpact(newRate || 0, Number(rate.current_rate), Number(rate.monthly_volume));
  const status = marketStatus(newRate || 0, rate.market_low !== null ? Number(rate.market_low) : null, rate.market_high !== null ? Number(rate.market_high) : null);

  async function submit(values: ReviseRateInput) {
    const result = await applyRateRevision(rate.id, values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`${rate.materialName} rate updated to ${formatINR(values.newRate)}`);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Revise rate — {rate.materialName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span className="text-muted-foreground">Current rate</span>
            <span className="font-medium">{formatINR(Number(rate.current_rate))}</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-dashed px-3 py-2 text-sm">
            <span className="text-muted-foreground">Suggested new rate ({(Number(rate.planned_increase_pct) * 100).toFixed(1)}% increase, rounded to ₹{Number(rate.round_step)})</span>
            <span className="font-medium">{formatINR(suggested)}</span>
          </div>
          <Field id="newRate" label="New rate (₹)" error={errors.newRate?.message}>
            <Input id="newRate" type="number" step="0.01" {...register("newRate", { valueAsNumber: true })} />
          </Field>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Estimated monthly business impact</span>
            <span className={impact > 0 ? "text-destructive" : "text-foreground"}>{formatINR(impact)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Market comparison</span>
            <Badge variant={status === "above_market" ? "destructive" : "outline"}>{MARKET_STATUS_LABELS[status]}</Badge>
          </div>
          <Field id="reason" label="Reason (optional)">
            <Input id="reason" {...register("reason")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Applying..." : "Apply revision"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
