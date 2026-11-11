import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Receipt } from "lucide-react";
import { requireCurrentUserContext } from "@/lib/data/organization";
import { getClientById, listProjectsForClient } from "@/lib/data/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { PROJECT_STATUS_LABELS } from "@/lib/validations/project";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireCurrentUserContext();
  const client = await getClientById(ctx.organizationId, id);
  if (!client) notFound();

  const projects = await listProjectsForClient(ctx.organizationId, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href="/clients"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Back to clients
          </Link>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{client.name}</h1>
          {client.archived_at && <Badge variant="outline">Archived</Badge>}
        </div>
        <ClientFormDialog client={client} trigger={<button type="button">Edit client</button>} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contact details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <DetailRow label="Mobile" value={client.mobile} />
            <DetailRow label="Email" value={client.email} />
            <DetailRow label="Alternate contact" value={client.alternate_contact} />
            <DetailRow label="Address" value={client.address} />
            <DetailRow
              label="City / State"
              value={[client.city, client.state].filter(Boolean).join(", ") || null}
            />
            <DetailRow label="PIN code" value={client.pin_code} />
            <DetailRow
              label="Property type"
              value={client.property_type?.replace(/_/g, " ") ?? null}
            />
            {client.notes && (
              <div className="pt-2">
                <p className="text-muted-foreground">Notes</p>
                <p className="whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No projects yet for this client.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {projects.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/projects/${p.id}`}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent"
                    >
                      <span>{p.name}</span>
                      <Badge variant="secondary" className="capitalize">
                        {PROJECT_STATUS_LABELS[p.status as keyof typeof PROJECT_STATUS_LABELS] ??
                          p.status}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileText className="size-4" /> Quotation history
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="py-4 text-center text-sm text-muted-foreground">
              Available once Quotations ships in Phase 7.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Receipt className="size-4" /> Payment history
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="py-4 text-center text-sm text-muted-foreground">
              Available once Expense &amp; Payment tracking ships in Phase 8.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value || "—"}</span>
    </div>
  );
}
