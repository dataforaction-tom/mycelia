"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContactDetails } from "@/lib/db/schema/connections";

type ConnectionType = "person" | "organisation" | "group" | "community";

interface EditConnectionModalProps {
  connectionId: string;
  organisationId: string;
  initialName: string;
  initialType: ConnectionType;
  initialContact: ContactDetails;
}

const TYPE_OPTIONS: { value: ConnectionType; label: string }[] = [
  { value: "person", label: "Person" },
  { value: "organisation", label: "Organisation" },
  { value: "group", label: "Group" },
  { value: "community", label: "Community" },
];

const CONTACT_FIELDS: {
  key: keyof ContactDetails;
  label: string;
  type: string;
  placeholder: string;
}[] = [
  {
    key: "email",
    label: "Email",
    type: "email",
    placeholder: "name@example.org",
  },
  { key: "phone", label: "Phone", type: "tel", placeholder: "+44 …" },
  { key: "website", label: "Website", type: "url", placeholder: "example.org" },
  {
    key: "location",
    label: "Location",
    type: "text",
    placeholder: "Bristol, UK",
  },
];

/**
 * Single "Edit connection" experience: name, type, and contact details in one
 * Radix dialog, PATCHing /api/connections/[id]. Replaces the old inline
 * contact-details editor so there's one place to change a connection.
 */
export function EditConnectionModal({
  connectionId,
  organisationId,
  initialName,
  initialType,
  initialContact,
}: EditConnectionModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<ConnectionType>(initialType);
  const [contact, setContact] = useState<ContactDetails>(initialContact);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    // Re-seed the draft from the latest props each time the dialog opens, so a
    // cancelled edit doesn't leave stale values behind on the next open.
    if (next) {
      setName(initialName);
      setType(initialType);
      setContact(initialContact);
      setError(null);
    }
    setOpen(next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-organisation-id": organisationId,
        },
        body: JSON.stringify({
          name: name.trim(),
          type,
          contactDetails: contact,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  const selectClasses =
    "flex h-10 w-full rounded-lg border border-border-input bg-white px-3 py-2 text-sm text-bark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit connection</DialogTitle>
          <DialogDescription>
            Update the name, type, and contact details for this connection.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm"
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-connection-name">Name</Label>
            <Input
              id="edit-connection-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Sarah from the community centre"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-connection-type">Type</Label>
            <select
              id="edit-connection-type"
              value={type}
              onChange={(event) =>
                setType(event.target.value as ConnectionType)
              }
              className={selectClasses}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <legend className="text-muted mb-1 text-xs font-medium tracking-[0.14em] uppercase">
              Contact
            </legend>
            {CONTACT_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`edit-connection-${field.key}`}>
                  {field.label}
                </Label>
                <Input
                  id={`edit-connection-${field.key}`}
                  type={field.type}
                  value={contact[field.key] ?? ""}
                  onChange={(event) =>
                    setContact((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </fieldset>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isSaving}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
