"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  projectSchema,
  type ProjectInput,
} from "@/lib/validations/project";
import { PROPERTY_TYPES } from "@/lib/validations/client";
import type { ClientOption, DesignerOption } from "@/lib/data/projects";

const PROPERTY_TYPE_LABELS: Record<(typeof PROPERTY_TYPES)[number], string> = {
  apartment: "Apartment",
  villa: "Villa",
  independent_house: "Independent House",
  office: "Office",
  commercial: "Commercial",
};

export function ProjectForm({
  clients,
  designers,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  clients: ClientOption[];
  designers: DesignerOption[];
  defaultValues?: Partial<ProjectInput>;
  onSubmit: (values: ProjectInput) => Promise<{ error: string | null }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      propertyAddress: "",
      description: "",
      status: "enquiry",
      ...defaultValues,
    },
  });

  async function submit(values: ProjectInput) {
    setServerError(null);
    const result = await onSubmit(values);
    if (result.error) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="name" label="Project name" error={errors.name?.message} required>
          <Input id="name" {...register("name")} />
        </Field>
        <Field id="clientId" label="Client" error={errors.clientId?.message} required>
          <Controller
            control={control}
            name="clientId"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="clientId" className="w-full">
                  <SelectValue placeholder="Select client">
                    {(value: string | null) =>
                      clients.find((c) => c.id === value)?.name ?? "Select client"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {clients.length === 0 && (
            <p className="text-xs text-muted-foreground">Add a client first.</p>
          )}
        </Field>

        <Field id="propertyType" label="Property type" error={errors.propertyType?.message}>
          <Controller
            control={control}
            name="propertyType"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="propertyType" className="w-full">
                  <SelectValue placeholder="Select type">
                    {(value: string | null) => (value ? PROPERTY_TYPE_LABELS[value as keyof typeof PROPERTY_TYPE_LABELS] : "Select type")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {PROPERTY_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="status" label="Status" error={errors.status?.message} required>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue>
                    {(value: string | null) =>
                      PROJECT_STATUS_LABELS[(value ?? "enquiry") as keyof typeof PROJECT_STATUS_LABELS]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {PROJECT_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field id="bedrooms" label="Bedrooms" error={errors.bedrooms?.message}>
          <Input id="bedrooms" type="number" min={0} {...register("bedrooms", { valueAsNumber: true })} />
        </Field>
        <Field id="bathrooms" label="Bathrooms" error={errors.bathrooms?.message}>
          <Input id="bathrooms" type="number" min={0} {...register("bathrooms", { valueAsNumber: true })} />
        </Field>
        <Field id="carpetArea" label="Carpet area (sqft)" error={errors.carpetArea?.message}>
          <Input
            id="carpetArea"
            type="number"
            min={0}
            step="0.01"
            {...register("carpetArea", { valueAsNumber: true })}
          />
        </Field>
        <Field id="builtUpArea" label="Built-up area (sqft)" error={errors.builtUpArea?.message}>
          <Input
            id="builtUpArea"
            type="number"
            min={0}
            step="0.01"
            {...register("builtUpArea", { valueAsNumber: true })}
          />
        </Field>

        <Field id="startDate" label="Start date" error={errors.startDate?.message}>
          <Input id="startDate" type="date" {...register("startDate")} />
        </Field>
        <Field
          id="expectedCompletionDate"
          label="Expected completion"
          error={errors.expectedCompletionDate?.message}
        >
          <Input id="expectedCompletionDate" type="date" {...register("expectedCompletionDate")} />
        </Field>

        <Field
          id="assignedDesignerId"
          label="Assigned designer"
          error={errors.assignedDesignerId?.message}
        >
          <Controller
            control={control}
            name="assignedDesignerId"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger id="assignedDesignerId" className="w-full">
                  <SelectValue placeholder="Unassigned">
                    {(value: string | null) =>
                      designers.find((d) => d.id === value)?.label ?? "Unassigned"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {designers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <Field id="propertyAddress" label="Property address" error={errors.propertyAddress?.message}>
        <Textarea id="propertyAddress" rows={2} {...register("propertyAddress")} />
      </Field>
      <Field id="description" label="Description" error={errors.description?.message}>
        <Textarea id="description" rows={3} {...register("description")} />
      </Field>

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

function Field({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
