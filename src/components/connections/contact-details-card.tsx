"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContactDetails } from "@/lib/db/schema/connections";

interface ContactDetailsCardProps {
  connectionId: string;
  organisationId: string;
  initial: ContactDetails;
  /** Whether the current member can edit (contributor and above). */
  canEdit: boolean;
}

const FIELDS: {
  key: keyof ContactDetails;
  label: string;
  placeholder: string;
  type: string;
}[] = [
  { key: "email", label: "Email", placeholder: "name@example.org", type: "email" },
  { key: "phone", label: "Phone", placeholder: "+44 …", type: "tel" },
  { key: "website", label: "Website", placeholder: "example.org", type: "url" },
  { key: "location", label: "Location", placeholder: "Bristol, UK", type: "text" },
];

/** Turn a bare website into a safe href. */
function websiteHref(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function ContactDetailsCard({
  connectionId,
  organisationId,
  initial,
  canEdit,
}: ContactDetailsCardProps) {
  const router = useRouter();
  const [details, setDetails] = useState<ContactDetails>(initial);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ContactDetails>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAny = FIELDS.some((f) => details[f.key]);

  function startEditing() {
    setDraft(details);
    setError(null);
    setIsEditing(true);
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/connections/${connectionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-organisation-id": organisationId,
        },
        body: JSON.stringify({ contactDetails: draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      // The server normalises (strips blanks); mirror that in the UI.
      setDetails(data.data.contactDetails ?? {});
      setIsEditing(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-lift">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Contact
        </h2>
        {canEdit && !isEditing && (
          <button
            type="button"
            onClick={startEditing}
            className="text-xs font-medium text-moss-dark hover:underline"
          >
            {hasAny ? "Edit" : "Add"}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-3">
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
              {error}
            </p>
          )}
          {FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-bark-light">
                {field.label}
              </label>
              <input
                type={field.type}
                value={draft[field.key] ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [field.key]: e.target.value }))
                }
                placeholder={field.placeholder}
                className="mt-1 w-full rounded-lg border border-border-strong bg-white px-3 py-2 text-sm text-bark placeholder:text-muted-light focus:border-moss/50 focus:outline-none"
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="rounded-lg px-3 py-1.5 text-sm text-muted hover:text-bark disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-terracotta px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : hasAny ? (
        <dl className="mt-4 space-y-3 text-sm">
          {details.email && (
            <div>
              <dt className="text-xs text-muted">Email</dt>
              <dd>
                <a
                  href={`mailto:${details.email}`}
                  className="text-moss-dark hover:underline"
                >
                  {details.email}
                </a>
              </dd>
            </div>
          )}
          {details.phone && (
            <div>
              <dt className="text-xs text-muted">Phone</dt>
              <dd>
                <a
                  href={`tel:${details.phone.replace(/\s+/g, "")}`}
                  className="text-bark hover:underline"
                >
                  {details.phone}
                </a>
              </dd>
            </div>
          )}
          {details.website && (
            <div>
              <dt className="text-xs text-muted">Website</dt>
              <dd>
                <a
                  href={websiteHref(details.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-moss-dark hover:underline"
                >
                  {details.website}
                </a>
              </dd>
            </div>
          )}
          {details.location && (
            <div>
              <dt className="text-xs text-muted">Location</dt>
              <dd className="text-bark">{details.location}</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="mt-4 text-sm text-muted">
          No contact details yet.
          {canEdit ? " Add a way to reach this connection." : ""}
        </p>
      )}
    </div>
  );
}
