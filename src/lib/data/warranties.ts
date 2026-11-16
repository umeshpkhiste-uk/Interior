import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type WarrantyRow = Database["public"]["Tables"]["warranties"]["Row"];

const ENDING_SOON_WITHIN_DAYS = 60;

export type WarrantyListItem = WarrantyRow & {
  projectCode: string;
  projectName: string;
  clientName: string;
  validTill: string;
  daysLeft: number;
  statusLabel: "Under warranty" | "Ending soon" | "Over";
};

export async function listWarranties(organizationId: string): Promise<WarrantyListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("warranties")
    .select("*, projects(project_code, name, clients(name))")
    .eq("organization_id", organizationId)
    .order("handover_date", { ascending: false });
  if (error) throw error;

  const today = new Date();

  return (data ?? [])
    .map((row) => {
      const { projects, ...rest } = row as typeof row & {
        projects: { project_code: string; name: string; clients: { name: string } | null } | null;
      };
      const validTill = addYears(rest.handover_date, rest.warranty_years);
      const daysLeft = daysBetween(today, validTill);
      const statusLabel: WarrantyListItem["statusLabel"] =
        daysLeft < 0 ? "Over" : daysLeft <= ENDING_SOON_WITHIN_DAYS ? "Ending soon" : "Under warranty";

      return {
        ...rest,
        projectCode: projects?.project_code ?? "—",
        projectName: projects?.name ?? "—",
        clientName: projects?.clients?.name ?? "—",
        validTill: validTill.toISOString().slice(0, 10),
        daysLeft,
        statusLabel,
      };
    })
    .sort((a, b) => a.validTill.localeCompare(b.validTill));
}

function addYears(dateStr: string, years: number): Date {
  const date = new Date(`${dateStr}T00:00:00`);
  const days = Math.round(years * 365.25);
  return new Date(date.getTime() + days * 86_400_000);
}

function daysBetween(from: Date, to: Date): number {
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((to.getTime() - fromMidnight.getTime()) / 86_400_000);
}
