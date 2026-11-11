"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  organizationProfileSchema,
  type OrganizationProfileInput,
} from "@/lib/validations/organization";
import { updateOrganizationProfile } from "@/lib/actions/organization";
import type { OrganizationProfile } from "@/lib/data/organization";

export function StudioProfileForm({
  organization,
  canEdit,
}: {
  organization: OrganizationProfile;
  canEdit: boolean;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationProfileInput>({
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: {
      name: organization.name,
      address: organization.address ?? "",
      gstin: organization.gstin ?? "",
      contactPhone: organization.contact_phone ?? "",
      contactEmail: organization.contact_email ?? "",
      quotationPrefix: organization.quotation_prefix,
      defaultGstPercent: Number(organization.default_gst_pct) * 100,
      defaultContingencyPercent: Number(organization.default_contingency_pct) * 100,
    },
  });

  async function onSubmit(values: OrganizationProfileInput) {
    setServerError(null);
    const result = await updateOrganizationProfile(values);
    if (result.error) {
      setServerError(result.error);
    } else {
      toast.success("Studio profile updated");
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Studio profile</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {serverError && <p className="col-span-full text-sm text-destructive">{serverError}</p>}
          <Field label="Studio name" error={errors.name?.message}>
            <Input disabled={!canEdit} {...register("name")} />
          </Field>
          <Field label="GSTIN" error={errors.gstin?.message}>
            <Input disabled={!canEdit} {...register("gstin")} />
          </Field>
          <Field label="Contact phone" error={errors.contactPhone?.message}>
            <Input disabled={!canEdit} {...register("contactPhone")} />
          </Field>
          <Field label="Contact email" error={errors.contactEmail?.message}>
            <Input disabled={!canEdit} type="email" {...register("contactEmail")} />
          </Field>
          <Field label="Quotation number prefix" error={errors.quotationPrefix?.message}>
            <Input disabled={!canEdit} {...register("quotationPrefix")} />
          </Field>
          <div />
          <Field label="Default GST %" error={errors.defaultGstPercent?.message}>
            <Input disabled={!canEdit} type="number" step="0.01" {...register("defaultGstPercent", { valueAsNumber: true })} />
          </Field>
          <Field label="Default contingency %" error={errors.defaultContingencyPercent?.message}>
            <Input
              disabled={!canEdit}
              type="number"
              step="0.01"
              {...register("defaultContingencyPercent", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Address" error={errors.address?.message} className="col-span-full">
            <Textarea disabled={!canEdit} rows={2} {...register("address")} />
          </Field>
        </CardContent>
        {canEdit && (
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
