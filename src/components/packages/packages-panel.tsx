import { ensurePackagesExist } from "@/lib/actions/packages";
import { listPackages } from "@/lib/data/packages";
import { PackageTierCard } from "./package-tier-card";

export async function PackagesPanel({
  organizationId,
  projectId,
  carpetArea,
}: {
  organizationId: string;
  projectId: string;
  carpetArea: number | null;
}) {
  await ensurePackagesExist(organizationId, projectId);
  const packages = await listPackages(organizationId, projectId);

  return (
    <div className="flex flex-col gap-4">
      {!carpetArea && (
        <p className="text-sm text-amber-600">
          Set the project&apos;s carpet area (in the Overview tab) to see package prices.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {packages.map((pkg) => (
          <PackageTierCard key={pkg.id} pkg={pkg} projectId={projectId} carpetArea={carpetArea} />
        ))}
      </div>
    </div>
  );
}
