"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/shared/field";
import { uploadInspirationImage } from "@/lib/actions/inspiration";
import {
  inspirationImageMetaSchema,
  INSPIRATION_CATEGORIES,
  INSPIRATION_CATEGORY_LABELS,
  type InspirationImageMetaInput,
} from "@/lib/validations/inspiration";
import type { MoodboardRow } from "@/lib/data/inspiration";
import type { RoomOption } from "@/lib/data/rooms";

export function UploadImageDialog({
  projectId,
  rooms,
  moodboards,
}: {
  projectId: string;
  rooms: RoomOption[];
  moodboards: MoodboardRow[];
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<InspirationImageMetaInput>({
    resolver: zodResolver(inspirationImageMetaSchema),
    defaultValues: { category: "living_room", roomId: "", moodboardId: "", notes: "", materialSpecification: "" },
  });

  async function submit(values: InspirationImageMetaInput) {
    if (!file) {
      toast.error("Choose an image to upload.");
      return;
    }
    setSubmitting(true);
    const result = await uploadInspirationImage(projectId, file, values);
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    reset();
    setFile(null);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          reset();
          setFile(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm">
            <Upload className="size-4" />
            Upload image
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload an inspiration image</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          <Field id="file" label="Image" required>
            <input
              id="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </Field>
          <Field id="category" label="Category" error={errors.category?.message} required>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue>{() => INSPIRATION_CATEGORY_LABELS[field.value] ?? "Select category"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {INSPIRATION_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {INSPIRATION_CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field id="roomId" label="Room (optional)">
            <Controller
              control={control}
              name="roomId"
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger id="roomId" className="w-full">
                    <SelectValue>{() => rooms.find((r) => r.id === field.value)?.name ?? "No room"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No room</SelectItem>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field id="moodboardId" label="Moodboard (optional)">
            <Controller
              control={control}
              name="moodboardId"
              render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger id="moodboardId" className="w-full">
                    <SelectValue>{() => moodboards.find((m) => m.id === field.value)?.name ?? "No moodboard"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No moodboard</SelectItem>
                    {moodboards.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field id="materialSpecification" label="Material specification">
            <Textarea id="materialSpecification" rows={2} {...register("materialSpecification")} />
          </Field>
          <Field id="notes" label="Notes">
            <Textarea id="notes" rows={2} {...register("notes")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
