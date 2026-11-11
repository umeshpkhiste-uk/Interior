"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/shared/field";
import {
  roomSchema,
  ROOM_CATEGORIES,
  ROOM_CATEGORY_LABELS,
  UNIT_SYSTEMS,
  type RoomInput,
} from "@/lib/validations/room";

const UNIT_LABELS: Record<(typeof UNIT_SYSTEMS)[number], string> = {
  feet_inches: "Feet",
  metric: "Meters",
};

export function RoomForm({
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  defaultValues?: Partial<RoomInput>;
  onSubmit: (values: RoomInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoomInput>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      roomName: "",
      roomCategory: "other",
      unitSystem: "feet_inches",
      length: 0,
      width: 0,
      height: 10,
      ...defaultValues,
    },
  });

  async function submit(values: RoomInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="roomName" label="Room name" error={errors.roomName?.message} required>
          <Input id="roomName" {...register("roomName")} />
        </Field>
        <Field id="roomCategory" label="Category" error={errors.roomCategory?.message}>
          <Controller
            control={control}
            name="roomCategory"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="roomCategory" className="w-full">
                  <SelectValue>{(v: string | null) => ROOM_CATEGORY_LABELS[v as keyof typeof ROOM_CATEGORY_LABELS] ?? "Select"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ROOM_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {ROOM_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="unitSystem" label="Units" error={errors.unitSystem?.message}>
          <Controller
            control={control}
            name="unitSystem"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="unitSystem" className="w-full">
                  <SelectValue>{(v: string | null) => UNIT_LABELS[v as keyof typeof UNIT_LABELS] ?? "Select"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {UNIT_SYSTEMS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {UNIT_LABELS[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="length" label="Length" error={errors.length?.message} required>
          <Input id="length" type="number" step="0.01" {...register("length", { valueAsNumber: true })} />
        </Field>
        <Field id="width" label="Width" error={errors.width?.message} required>
          <Input id="width" type="number" step="0.01" {...register("width", { valueAsNumber: true })} />
        </Field>
        <Field id="height" label="Height" error={errors.height?.message} required>
          <Input id="height" type="number" step="0.01" {...register("height", { valueAsNumber: true })} />
        </Field>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
