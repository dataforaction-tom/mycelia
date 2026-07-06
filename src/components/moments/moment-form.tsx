"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ConnectionPicker } from "@/components/connections/connection-picker";
import { MomentUnderstandingPanel } from "@/components/moments/moment-understanding-panel";

interface Connection {
  id: string;
  name: string;
  type: string;
}

interface MomentFormProps {
  organisationId: string;
  orgSlug: string;
  connections: Connection[];
  preselectedConnectionId?: string;
}

export function MomentForm({
  organisationId,
  orgSlug,
  connections,
  preselectedConnectionId,
}: MomentFormProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<string[]>(
    preselectedConnectionId ? [preselectedConnectionId] : []
  );
  const [eventDate, setEventDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-grow textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/moments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organisation-id": organisationId,
        },
        body: JSON.stringify({
          content,
          connectionIds: selectedConnectionIds,
          eventDate: eventDate || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      // Navigate back to the connection or moments list
      if (preselectedConnectionId) {
        router.push(
          `/${orgSlug}/connections/${preselectedConnectionId}`
        );
      } else {
        router.push(`/${orgSlug}`);
      }
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-bark"
        >
          What happened?
        </label>
        <textarea
          id="content"
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Had coffee with Sarah — she's worried about funding for the winter programme..."
          required
          rows={4}
          className="mt-1 block w-full resize-none rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-bark placeholder:text-muted-light focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
        <p className="mt-1 text-xs text-muted">
          Press Cmd+Enter to submit
        </p>
      </div>

      <MomentUnderstandingPanel
        content={content}
        organisationId={organisationId}
        onConnectionsMatched={(ids) =>
          setSelectedConnectionIds((prev) => [
            ...new Set([...prev, ...ids]),
          ])
        }
        onEventDateDetected={(date) =>
          setEventDate((prev) =>
            prev || (date ? date.toISOString().slice(0, 10) : prev)
          )
        }
      />

      <div>
        <label className="block text-sm font-medium text-bark">
          Who was involved?
        </label>
        <div className="mt-1">
          <ConnectionPicker
            connections={connections}
            selected={selectedConnectionIds}
            onChange={setSelectedConnectionIds}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="eventDate"
          className="block text-sm font-medium text-bark"
        >
          When did this happen?
        </label>
        <input
          id="eventDate"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-bark focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
        />
        <p className="mt-1 text-xs text-muted">
          Defaults to when you record it, if left blank.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-terracotta px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark disabled:opacity-50"
      >
        {isSubmitting ? "Recording..." : "Record moment"}
      </button>
    </form>
  );
}
