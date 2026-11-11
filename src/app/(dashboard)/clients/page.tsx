import { requireCurrentUserContext } from "@/lib/data/organization";
import { listClients } from "@/lib/data/clients";
import { Card, CardContent } from "@/components/ui/card";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ClientsTable } from "@/components/clients/clients-table";
import { SearchBar } from "@/components/shared/search-bar";

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage client contacts and view their project history.
          </p>
        </div>
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
