"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { setMaterialArchived } from "@/lib/actions/materials";
import type { MaterialWithCategory } from "@/lib/data/materials";

export function MaterialsTable({ materials }: { materials: MaterialWithCategory[] }) {
  const router = useRouter();

  async function handleArchive(id: string) {
    const result = await setMaterialArchived(id, true);
    if (result.error) toast.error(result.error);
    else router.refresh();
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Description</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {materials.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="font-medium">{m.name}</TableCell>
            <TableCell className="text-muted-foreground">{m.categoryName ?? "—"}</TableCell>
            <TableCell>{m.unit}</TableCell>
            <TableCell className="text-muted-foreground">{m.description ?? "—"}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" onClick={() => handleArchive(m.id)}>
                Archive
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {materials.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              No materials found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
