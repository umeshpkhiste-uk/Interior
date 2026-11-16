import { Tags } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listMaterialRates, listMaterialsWithoutRate } from "@/lib/data/rates";
import { listSuppliers } from "@/lib/data/materials";
import { RateFormDialog } from "@/components/rates/rate-form-dialog";
import { RatesTable } from "@/components/rates/rates-table";
import { ModuleHeader } from "@/components/layout/module-header";
import { MODULE_HEADER_IMAGES } from "@/components/layout/module-header-images";

export default async function RatesPage() {
  const ctx = await requireCurrentUserContext();
  const [rates, materialsWithoutRate, suppliers] = await Promise.all([
    listMaterialRates(ctx.organizationId),
    listMaterialsWithoutRate(ctx.organizationId),
    listSuppliers(ctx.organizationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <ModuleHeader
        icon={Tags}
        kitLabel="Core Toolkit • Rate Management"
        title="Rate Management"
        subtitle="Review, revise, and track the history of material rates. Approved quotations always keep their original rates — revising here never changes an already-sent quotation."
        badges={["Rates", "History", "Suppliers"]}
        image={MODULE_HEADER_IMAGES.livingRoom}
      />

      <div className="flex justify-end">
        <RateFormDialog materialsWithoutRate={materialsWithoutRate} suppliers={suppliers} />
      </div>

      <RatesTable rates={rates} />
    </div>
  );
}
