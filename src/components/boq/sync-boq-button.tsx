"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { syncBoqFromEstimators } from "@/lib/actions/boq";

export function SyncBoqButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    const result = await syncBoqFromEstimators(projectId);
    setSyncing(false);
    if (result.error || !result.data) {
      toast.error(result.error ?? "Sync failed");
      return;
    }
    toast.success(`Synced ${result.data.count} line(s) from estimators`);
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
      <RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing..." : "Sync from Estimators"}
    </Button>
  );
}
