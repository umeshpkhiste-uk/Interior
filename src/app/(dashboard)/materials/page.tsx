import { requireCurrentUserContext } from "@/lib/data/organization";
import { listMaterialCategories, listMaterials, listSuppliers } from "@/lib/data/materials";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchBar } from "@/components/shared/search-bar";
import { MaterialFormDialog } from "@/components/materials/material-form-dialog";
import { CategoryFormDialog } from "@/components/materials/category-form-dialog";
import { SupplierFormDialog } from "@/components/materials/supplier-form-dialog";
import { MaterialsTable } from "@/components/materials/materials-table";

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const ctx = await requireCurrentUserContext();
  const [categories, materials, suppliers] = await Promise.all([
    listMaterialCategories(ctx.organizationId),
    listMaterials(ctx.organizationId, q),
    listSuppliers(ctx.organizationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Material Library</h1>
        <p className="text-sm text-muted-foreground">
          Materials, categories, and suppliers shared across every project and estimator.
        </p>
      </div>

      <Tabs defaultValue="materials">
        <TabsList>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="flex flex-col gap-4 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchBar placeholder="Search materials..." />
            <MaterialFormDialog categories={categories} />
          </div>
          <MaterialsTable materials={materials} />
        </TabsContent>

        <TabsContent value="categories" className="flex flex-col gap-4 pt-4">
          <div className="flex justify-end">
            <CategoryFormDialog categories={categories} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Parent category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {categories.find((p) => p.id === c.parent_category_id)?.name ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No categories yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="suppliers" className="flex flex-col gap-4 pt-4">
          <div className="flex justify-end">
            <SupplierFormDialog />
          </div>
          {suppliers.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">No suppliers yet.</CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.contact_phone ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{s.contact_email ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{s.address ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
