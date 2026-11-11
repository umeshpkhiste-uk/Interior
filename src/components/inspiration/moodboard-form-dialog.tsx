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
import { createMoodboard } from "@/lib/actions/inspiration";
import { moodboardSchema, type MoodboardInput } from "@/lib/validations/inspiration";

export function MoodboardFormDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<MoodboardInput>({
    resolver: zodResolver(moodboardSchema),
    defaultValues: { name: "", description: "" },
  });

  async function submit(values: MoodboardInput) {
    const result = await createMoodboard(projectId, values);
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
            New moodboard
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a moodboard</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <Field id="name" label="Name" error={errors.name?.message} required>
            <Input id="name" {...register("name")} />
          </Field>
          <Field id="description" label="Description">
            <Textarea id="description" rows={3} {...register("description")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
