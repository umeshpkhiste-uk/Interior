"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/calculations/shared";
import { packageRatePerSqft, packagePrice } from "@/lib/calculations/packages";
import { selectPackageTier, savePackageSettings, generateQuotationFromPackage } from "@/lib/actions/packages";
import { PackageComponentsEditor } from "./package-components-editor";
import { PACKAGE_TIER_LABELS } from "@/lib/validations/packages";
import type { PackageWithComponents } from "@/lib/data/packages";
import type { Database } from "@/lib/supabase/types";

type PackageTier = Database["public"]["Enums"]["package_tier"];

export function PackageTierCard({
  pkg,
  projectId,
  carpetArea,
}: {
  pkg: PackageWithComponents;
  projectId: string;
  carpetArea: number | null;
}) {
  const router = useRouter();
  const [roundStep, setRoundStep] = useState(String(Number(pkg.round_step)));
  const [busy, setBusy] = useState(false);

  const ratePerSqft = packageRatePerSqft(pkg.components.map((c) => ({ ratePerSqft: Number(c.rate_per_sqft) })));
  const price = carpetArea ? packagePrice(carpetArea, ratePerSqft, Number(pkg.round_step)) : 0;

  async function handleSelect() {
    const result = await selectPackageTier(projectId, pkg.tier as PackageTier);
    if (result.error) toast.error(result.error);
    else {
      toast.success(`${PACKAGE_TIER_LABELS[pkg.tier as PackageTier]} selected`);
      router.refresh();
    }
  }

  async function handleRoundStepSave() {
    const value = Number(roundStep);
    if (Number.isNaN(value)) return;
    const result = await savePackageSettings(pkg.id, projectId, { roundStep: value });
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  async function handleGenerateQuotation() {
    if (!carpetArea) {
      toast.error("Set the project's carpet area first");
      return;
    }
    setBusy(true);
    const result = await generateQuotationFromPackage(projectId, pkg.tier as PackageTier, price);
    setBusy(false);
    if (result.error || !result.data) toast.error(result.error ?? "Could not generate quotation");
    else router.push(`/quotations/${result.data.id}`);
  }

  return (
    <Card className={pkg.is_selected ? "border-primary" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{PACKAGE_TIER_LABELS[pkg.tier as PackageTier]}</CardTitle>
        {pkg.is_selected && <Badge>Selected</Badge>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Rate per sqft</p>
          <p className="text-sm font-medium">{formatINR(ratePerSqft)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Package price</p>
          <p className="font-heading text-xl font-semibold">{formatINR(price)}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Round to nearest (₹)</span>
          <Input
            type="number"
            className="h-6 w-24"
            value={roundStep}
            onChange={(e) => setRoundStep(e.target.value)}
            onBlur={handleRoundStepSave}
          />
        </div>
        <PackageComponentsEditor packageId={pkg.id} projectId={projectId} components={pkg.components} />
        <div className="flex flex-col gap-2 pt-2">
          <Button type="button" size="sm" variant={pkg.is_selected ? "secondary" : "outline"} onClick={handleSelect}>
            {pkg.is_selected ? "Selected" : "Select this tier"}
          </Button>
          <Button type="button" size="sm" disabled={busy} onClick={handleGenerateQuotation}>
            {busy ? "Generating..." : "Generate quotation"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
