"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/shared/field";
import { createMaterial } from "@/lib/actions/materials";
import { materialSchema, type MaterialInput } from "@/lib/validations/materials";
import type { MaterialCategoryRow } from "@/lib/data/materials";

export function MaterialFormDialog({ categories }: { categories: MaterialCategoryRow[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<MaterialInput>({
    resolver: zodResolver(materialSchema),
    defaultValues: { name: "", categoryId: "", unit: "", description: "" },
  });

  async function submit(values: MaterialInput) {
    const result = await createMaterial(values);
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
          <Button size="sm">
            <Plus className="size-4" />
            Add Material
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a material</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <Field id="name" label="Name" error={errors.name?.message} required>
            <Input id="name" {...register("name")} />
          </Field>
          <Field id="categoryId" label="Category">
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger id="categoryId" className="w-full">
                    <SelectValue>{() => categories.find((c) => c.id === field.value)?.name ?? "No category"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No category</SelectItem>
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
          <Field id="unit" label="Unit" error={errors.unit?.message} required>
            <Input id="unit" placeholder="sqft, rft, nos, kg..." {...register("unit")} />
          </Field>
          <Field id="description" label="Description">
            <Textarea id="description" rows={2} {...register("description")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add material"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
