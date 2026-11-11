import { requireCurrentUserContext } from "@/lib/data/organization";
import { listMaterialRates, listMaterialsWithoutRate } from "@/lib/data/rates";
import { listSuppliers } from "@/lib/data/materials";
import { RateFormDialog } from "@/components/rates/rate-form-dialog";
import { RatesTable } from "@/components/rates/rates-table";

export default async function RatesPage() {
  const ctx = await requireCurrentUserContext();
  const [rates, materialsWithoutRate, suppliers] = await Promise.all([
    listMaterialRates(ctx.organizationId),
    listMaterialsWithoutRate(ctx.organizationId),
    listSuppliers(ctx.organizationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Rate Management</h1>
          <p className="text-sm text-muted-foreground">
            Review, revise, and track the history of material rates. Approved quotations always keep their
            original rates — revising here never changes an already-sent quotation.
          </p>
        </div>
        <RateFormDialog materialsWithoutRate={materialsWithoutRate} suppliers={suppliers} />
      </div>

      <RatesTable rates={rates} />
    </div>
  );
}
