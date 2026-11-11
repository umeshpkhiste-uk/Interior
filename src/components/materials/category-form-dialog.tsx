"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/shared/field";
import { createMaterialCategory } from "@/lib/actions/materials";
import { materialCategorySchema, type MaterialCategoryInput } from "@/lib/validations/materials";
import type { MaterialCategoryRow } from "@/lib/data/materials";

export function CategoryFormDialog({ categories }: { categories: MaterialCategoryRow[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<MaterialCategoryInput>({
    resolver: zodResolver(materialCategorySchema),
    defaultValues: { name: "", parentCategoryId: "" },
  });

  async function submit(values: MaterialCategoryInput) {
    const result = await createMaterialCategory(values);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Plus className="size-4" />
            Add Category
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add a category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <Field id="name" label="Name" error={errors.name?.message} required>
            <Input id="name" {...register("name")} />
          </Field>
          <Field id="parentCategoryId" label="Parent category">
            <Controller
              control={control}
              name="parentCategoryId"
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger id="parentCategoryId" className="w-full">
                    <SelectValue>{() => categories.find((c) => c.id === field.value)?.name ?? "None (top-level)"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (top-level)</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
