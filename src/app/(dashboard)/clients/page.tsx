import { Users } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { listClients } from "@/lib/data/clients";
import { Card, CardContent } from "@/components/ui/card";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ClientsTable } from "@/components/clients/clients-table";
import { SearchBar } from "@/components/shared/search-bar";
import { ModuleHeader } from "@/components/layout/module-header";
import { MODULE_HEADER_IMAGES } from "@/components/layout/module-header-images";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; archived?: string }>;
}) {
  const { q, archived } = await searchParams;
  const ctx = await requireCurrentUserContext();
  const clients = await listClients(ctx.organizationId, {
    search: q,
    includeArchived: archived === "1",
  });

  return (
    <div className="flex flex-col gap-6">
      <ModuleHeader
        icon={Users}
        kitLabel="Core Toolkit • Clients"
        title="Clients"
        subtitle="Manage client contacts and view their project history."
        badges={["Contacts", "Projects", "History"]}
        image={MODULE_HEADER_IMAGES.livingRoom}
      />

      <div className="flex justify-end">
        <ClientFormDialog />
      </div>

      <div className="flex items-center gap-3">
        <SearchBar placeholder="Search clients..." />
      </div>

      <Card>
        <CardContent className="p-0">
          <ClientsTable clients={clients} />
        </CardContent>
      </Card>
    </div>
  );
}
