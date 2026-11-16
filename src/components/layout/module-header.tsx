import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The dark "kit" banner shown atop each of the toolkit's modules. `image` is
 * the same decorative illustration the source Excel workbook anchors to the
 * top-right of that kit's sheets (a living room, construction blueprint, or
 * modular kitchen render) — see public/images/module-header.
 */
export function ModuleHeader({
  icon: Icon,
  kitLabel,
  title,
  subtitle,
  badges,
  image,
}: {
  icon: LucideIcon;
  kitLabel: string;
  title: string;
  subtitle: string;
  badges: string[];
  image?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-[#211c18] px-6 py-5 text-[#f5efe6]">
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />
      {image && (
        <Image
          src={image}
          alt=""
          aria-hidden="true"
          width={220}
          height={134}
          className="pointer-events-none absolute top-1/2 right-2 hidden h-24 w-auto -translate-y-1/2 object-contain drop-shadow-lg sm:block md:h-28"
        />
      )}
      <div className={cn("flex flex-col gap-2", image && "sm:pr-36 md:pr-44")}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold tracking-wide text-amber-300">
          <Icon className="size-4" />
          <span>INTERIOR TOOLKIT</span>
          <span className="text-[#f5efe6]/30">•</span>
          <span className="font-medium text-[#f5efe6]/60">{kitLabel}</span>
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="text-sm text-[#f5efe6]/70">{subtitle}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-xs font-medium text-sky-300">
          {badges.map((badge, i) => (
            <span key={badge} className="flex items-center gap-2">
              {i > 0 && <span className="text-[#f5efe6]/30">•</span>}
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
