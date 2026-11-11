"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/shared/field";
import { createSupplier } from "@/lib/actions/materials";
import { supplierSchema, type SupplierInput } from "@/lib/validations/materials";

export function SupplierFormDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: "", contactPhone: "", contactEmail: "", address: "", notes: "" },
  });

  async function submit(values: SupplierInput) {
    const result = await createSupplier(values);
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
            Add Supplier
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a supplier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <Field id="name" label="Name" error={errors.name?.message} required>
            <Input id="name" {...register("name")} />
          </Field>
          <Field id="contactPhone" label="Phone">
            <Input id="contactPhone" {...register("contactPhone")} />
          </Field>
          <Field id="contactEmail" label="Email" error={errors.contactEmail?.message}>
            <Input id="contactEmail" type="email" {...register("contactEmail")} />
          </Field>
          <Field id="address" label="Address">
            <Textarea id="address" rows={2} {...register("address")} />
          </Field>
          <Field id="notes" label="Notes">
            <Textarea id="notes" rows={2} {...register("notes")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
