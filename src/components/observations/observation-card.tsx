"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ConnectionTypeBadge } from "@/components/ui/connection-type-badge";
import { Filaments } from "@/components/network/filaments";
import { Spores } from "@/components/network/spores";

interface LinkedConnection {
  id: string;
  name: string;
  type: string;
}

interface ObservationCardProps {
  id: string;
  type: string;
  content: string;
  severity: string;
  status: string;
  connections: LinkedConnection[];
  organisationId: string;
  orgSlug: string;
  /** The single most-severe/recent unresolved observation, shown large and dark. */
  featured?: boolean;
}

const severityColors: Record<string, string> = {
  gentle: "bg-sky/10 text-sky-dark",
  noteworthy: "bg-amber/10 text-amber-dark",
  important: "bg-terracotta/10 text-terracotta-dark",
};

// A soft severity accent along the card's left edge — colour does the
// signalling so the actions can stay quiet
const severityAccents: Record<string, string> = {
  gentle: "border-l-sky/60",
  noteworthy: "border-l-amber/70",
  important: "border-l-terracotta/70",
};

export function ObservationCard({
  id,
  type,
  content,
  severity,
  status: initialStatus,
  connections,
  organisationId,
  orgSlug,
  featured = false,
}: ObservationCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [showResponseInput, setShowResponseInput] = useState(false);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(
    newStatus: "acted_on" | "dismissed",
    userResponse?: string
  ) {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/observations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-organisation-id": organisationId,
        },
        body: JSON.stringify({
          status: newStatus,
          ...(userResponse ? { userResponse } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      setStatus(newStatus);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isResolved = status === "acted_on" || status === "dismissed";

  if (featured) {
    return (
      <div className="underground relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <Filaments width={400} height={70} count={5} seed={id.length} />
        <Spores count={3} seed={id.length} />
        <div className="relative">
          <p className="text-soil-ink-soft text-xs font-medium tracking-[0.12em] uppercase">
            Emerging pattern
          </p>
          <p className="font-display text-soil-ink mt-2 text-2xl leading-snug">
            {content}
          </p>

          {connections.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {connections.map((c) => (
                <Link key={c.id} href={`/${orgSlug}/connections/${c.id}`}>
                  <span className="border-spore/25 bg-spore/10 text-soil-ink hover:bg-spore/20 inline-flex cursor-pointer items-center rounded-full border px-2.5 py-0.5 text-xs transition-colors">
                    {c.name}
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="text-soil-ink-soft mt-4 flex items-center gap-2 text-xs">
            <span className="capitalize">{type.replace("_", " ")}</span>
            {isResolved && (
              <span className="capitalize">
                &middot; {status.replace("_", " ")}
              </span>
            )}
          </div>

          {error && (
            <p role="alert" className="text-destructive mt-2 text-sm">
              {error}
            </p>
          )}

          {!isResolved && (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => updateStatus("acted_on")}
                disabled={isSubmitting}
                className="border-spore/35 text-spore hover:bg-spore/10 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
              >
                Mark as acted on
              </button>
              <button
                type="button"
                onClick={() => updateStatus("dismissed")}
                disabled={isSubmitting}
                className="text-soil-ink-soft hover:text-soil-ink rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-border shadow-lift rounded-xl border border-l-2 bg-white/85 p-4 ${severityAccents[severity] ?? "border-l-border"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-bark text-sm">{content}</p>
        <Badge className={severityColors[severity] ?? ""}>{severity}</Badge>
      </div>

      {connections.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {connections.map((c) => (
            <Link key={c.id} href={`/${orgSlug}/connections/${c.id}`}>
              <ConnectionTypeBadge
                type={c.type}
                className="cursor-pointer transition-opacity hover:opacity-80"
              >
                {c.name}
              </ConnectionTypeBadge>
            </Link>
          ))}
        </div>
      )}

      <div className="text-muted mt-3 flex items-center gap-2 text-xs">
        <span className="capitalize">{type.replace("_", " ")}</span>
        {isResolved && (
          <span className="capitalize">
            &middot; {status.replace("_", " ")}
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {error}
        </p>
      )}

      {!isResolved && (
        <div className="mt-3 space-y-2">
          {showResponseInput ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="What did you do about this? (optional)"
                className="border-border bg-surface text-bark placeholder:text-muted-light focus:border-terracotta focus:ring-terracotta flex-1 rounded-lg border px-3 py-1.5 text-sm focus:ring-1 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => updateStatus("acted_on", response || undefined)}
                disabled={isSubmitting}
                className="bg-moss hover:bg-moss-dark shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Saving…" : "Save"}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowResponseInput(true)}
                disabled={isSubmitting}
                className="border-moss/40 text-moss-dark hover:bg-moss/10 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
              >
                Mark as acted on
              </button>
              <button
                type="button"
                onClick={() => updateStatus("dismissed")}
                disabled={isSubmitting}
                className="text-muted hover:bg-cream-dark hover:text-bark rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
