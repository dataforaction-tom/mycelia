"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Filaments } from "@/components/network/filaments";
import { Spores } from "@/components/network/spores";

interface ConnectionComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisationId: string;
  orgSlug: string;
}

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "person", label: "Person" },
  { value: "organisation", label: "Organisation" },
  { value: "group", label: "Group" },
  { value: "community", label: "Community" },
];

/**
 * "Begin a thread" — the quick way to add a connection, in the same soil-band
 * language as the moment composer. On success it opens the new connection's
 * story page, ready for its first moment.
 */
export function ConnectionComposerModal({
  open,
  onOpenChange,
  organisationId,
  orgSlug,
}: ConnectionComposerModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("person");
  const [showContact, setShowContact] = useState(false);
  const [contact, setContact] = useState({
    email: "",
    phone: "",
    website: "",
    location: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetAndClose() {
    setName("");
    setType("person");
    setShowContact(false);
    setContact({ email: "", phone: "", website: "", location: "" });
    setError(null);
    onOpenChange(false);
  }

  async function handleSubmit() {
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/connections", {
        method: "POST",
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

      resetAndClose();
      router.push(`/${orgSlug}/connections/${data.data.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetAndClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="bg-cream [&>button]:text-soil-ink-soft max-w-[560px] overflow-hidden rounded-3xl border-none p-0 shadow-[0_40px_100px_rgba(27,19,10,0.5)] [&>button]:opacity-80 [&>button]:hover:opacity-100">
        <div className="underground relative h-[86px] overflow-hidden rounded-none border-none">
          <Filaments width={560} height={86} count={4} seed={9} />
          <Spores count={3} seed={9} />
          <DialogTitle className="font-display text-soil-ink absolute bottom-4 left-6 text-2xl font-normal">
            Begin a thread
          </DialogTitle>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/10 text-destructive mb-3 rounded-lg border p-3 text-sm"
            >
              {error}
            </div>
          )}

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            aria-label="Who or what this thread is with"
            placeholder="Who — or what — is this thread with?"
            autoFocus
            className="border-border-strong text-bark placeholder:text-muted-light focus:border-moss/50 focus-visible:ring-terracotta w-full rounded-2xl border bg-white px-4 py-3 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={
                  type === option.value
                    ? "border-green/40 bg-green/15 text-green-dark rounded-full border px-3.5 py-1.5 text-xs font-semibold"
                    : "border-border-strong text-bark-light hover:bg-cream-dark rounded-full border px-3.5 py-1.5 text-xs"
                }
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Optional, light-touch contact details — tucked away until asked for */}
          {showContact ? (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="email"
                value={contact.email}
                onChange={(e) =>
                  setContact((c) => ({ ...c, email: e.target.value }))
                }
                aria-label="Email"
                placeholder="Email"
                className="border-border-strong text-bark placeholder:text-muted-light focus:border-moss/50 focus-visible:ring-terracotta w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white"
              />
              <input
                type="tel"
                value={contact.phone}
                onChange={(e) =>
                  setContact((c) => ({ ...c, phone: e.target.value }))
                }
                aria-label="Phone"
                placeholder="Phone"
                className="border-border-strong text-bark placeholder:text-muted-light focus:border-moss/50 focus-visible:ring-terracotta w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white"
              />
              <input
                type="url"
                value={contact.website}
                onChange={(e) =>
                  setContact((c) => ({ ...c, website: e.target.value }))
                }
                aria-label="Website"
                placeholder="Website"
                className="border-border-strong text-bark placeholder:text-muted-light focus:border-moss/50 focus-visible:ring-terracotta w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white"
              />
              <input
                type="text"
                value={contact.location}
                onChange={(e) =>
                  setContact((c) => ({ ...c, location: e.target.value }))
                }
                aria-label="Location"
                placeholder="Location"
                className="border-border-strong text-bark placeholder:text-muted-light focus:border-moss/50 focus-visible:ring-terracotta w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowContact(true)}
              className="text-moss-dark mt-4 text-xs font-medium hover:underline"
            >
              + Add contact details
            </button>
          )}

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-muted text-xs">
              A thread grows from its moments — you can plant the first one
              right after.
            </p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!name.trim() || isSubmitting}
              className="from-green-dark to-moss-dark shrink-0 rounded-full bg-gradient-to-r px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(111,154,79,0.35)] transition-all hover:brightness-105 disabled:opacity-50"
            >
              {isSubmitting ? "Beginning…" : "Begin the thread"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
