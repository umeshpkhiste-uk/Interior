"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClientForm } from "./client-form";
import { createClientRecord, updateClientRecord } from "@/lib/actions/clients";
import type { ClientInput } from "@/lib/validations/client";
import type { ClientRow } from "@/lib/data/clients";

export function ClientFormDialog({
  client,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  client?: ClientRow;
  trigger?: React.ReactElement | null;
  /** Pass to control the dialog externally (e.g. from a dropdown menu item,
   *  where nesting a trigger inside the menu would close the menu before
   *  the dialog can open). Omit for the default self-contained trigger. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const isEdit = Boolean(client);

  const defaultValues: Partial<ClientInput> | undefined = client
    ? {
        name: client.name,
        mobile: client.mobile ?? "",
        email: client.email ?? "",
        alternateContact: client.alternate_contact ?? "",
        address: client.address ?? "",
        city: client.city ?? "",
        state: client.state ?? "",
        pinCode: client.pin_code ?? "",
        propertyType: client.property_type ?? undefined,
        notes: client.notes ?? "",
      }
    : undefined;

  async function handleSubmit(values: ClientInput) {
    const result = isEdit
      ? await updateClientRecord(client!.id, values)
      : await createClientRecord(values);
    if (!result.error) {
      setOpen(false);
      router.refresh();
    }
    return { error: result.error };
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger
          render={
            trigger ?? (
              <Button size="sm">
                <Plus className="size-4" />
                Add Client
              </Button>
            )
          }
        />
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit client" : "Add a new client"}</DialogTitle>
        </DialogHeader>
        <ClientForm
          defaultValues={defaultValues}
          submitLabel={isEdit ? "Save changes" : "Add client"}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
