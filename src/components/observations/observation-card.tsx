"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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
}

const severityColors: Record<string, string> = {
  gentle: "bg-sky/10 text-sky",
  noteworthy: "bg-amber/10 text-amber",
  important: "bg-terracotta/10 text-terracotta",
};

const connectionTypeColors: Record<string, string> = {
  person: "bg-sky/10 text-sky",
  organisation: "bg-terracotta/10 text-terracotta",
  group: "bg-moss/10 text-moss",
  community: "bg-amber/10 text-amber",
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

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-bark">{content}</p>
        <Badge className={severityColors[severity] ?? ""}>{severity}</Badge>
      </div>

      {connections.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {connections.map((c) => (
            <Link key={c.id} href={`/${orgSlug}/connections/${c.id}`}>
              <Badge
                className={`cursor-pointer transition-opacity hover:opacity-80 ${connectionTypeColors[c.type] ?? ""}`}
              >
                {c.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        <span className="capitalize">{type.replace("_", " ")}</span>
        {isResolved && (
          <span className="capitalize">
            &middot; {status.replace("_", " ")}
          </span>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {!isResolved && (
        <div className="mt-3 space-y-2">
          {showResponseInput ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="What did you do about this? (optional)"
                className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-bark placeholder:text-muted-light focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
              <button
                type="button"
                onClick={() => updateStatus("acted_on", response || undefined)}
                disabled={isSubmitting}
                className="shrink-0 rounded-lg bg-moss px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50"
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
                className="rounded-lg bg-moss px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50"
              >
                Mark as acted on
              </button>
              <button
                type="button"
                onClick={() => updateStatus("dismissed")}
                disabled={isSubmitting}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-bark transition-colors hover:bg-cream-dark disabled:opacity-50"
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
