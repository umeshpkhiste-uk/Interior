import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Honest placeholder for a nav section whose module hasn't been built yet
 * in this phased rollout — not a fake interactive screen, just a clear
 * status so the sidebar never leads to a dead 404.
 */
export function ComingSoon({
  icon: Icon,
  title,
  description,
  phase,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Icon className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">This module ships in {phase}</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            The navigation, layout and data model are already in place — the {title.toLowerCase()}{" "}
            workflow is built next, following the project&apos;s phased delivery plan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
