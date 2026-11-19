import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MissingFloorPlanInput } from "@/lib/data/floor-plan";

export function FloorPlanMissingInputs({ missing }: { missing: MissingFloorPlanInput[] }) {
  if (missing.length === 0) return null;

  return (
    <Card className="border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-400">
          <AlertTriangle className="size-4" />
          Missing information ({missing.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 p-0">
        {missing.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between gap-2 border-t px-4 py-2.5 text-sm first:border-t-0 hover:bg-accent"
          >
            <span>{item.message}</span>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
