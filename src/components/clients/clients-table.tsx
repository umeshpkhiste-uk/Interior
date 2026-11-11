"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClientFormDialog } from "./client-form-dialog";
import { setClientArchived } from "@/lib/actions/clients";
import type { ClientRow } from "@/lib/data/clients";

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const router = useRouter();
  const [editingClient, setEditingClient] = useState<ClientRow | null>(null);

  async function toggleArchive(client: ClientRow) {
    await setClientArchived(client.id, client.archived_at === null);
    router.refresh();
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
        No clients found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Property Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium">
                <Link href={`/clients/${client.id}`} className="hover:underline">
                  {client.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.mobile || client.email || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{client.city ?? "—"}</TableCell>
              <TableCell className="capitalize text-muted-foreground">
                {client.property_type?.replace(/_/g, " ") ?? "—"}
              </TableCell>
              <TableCell>
                {client.archived_at ? (
                  <Badge variant="outline">Archived</Badge>
                ) : (
                  <Badge variant="secondary">Active</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label="Actions">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem render={<Link href={`/clients/${client.id}`}>View</Link>} />
                    <DropdownMenuItem onClick={() => setEditingClient(client)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleArchive(client)}>
                      {client.archived_at ? "Unarchive" : "Archive"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editingClient && (
        <ClientFormDialog
          client={editingClient}
          trigger={null}
          open={editingClient !== null}
          onOpenChange={(open) => !open && setEditingClient(null)}
        />
      )}
    </div>
  );
}
