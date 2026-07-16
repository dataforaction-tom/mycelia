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

interface Space {
  id: string;
  name: string;
}

interface MomentFormProps {
  organisationId: string;
  orgSlug: string;
  connections: Connection[];
  spaces: Space[];
  preselectedConnectionId?: string;
}

export function MomentForm({
  organisationId,
  orgSlug,
  connections,
  spaces,
  preselectedConnectionId,
}: MomentFormProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<string[]>(
    preselectedConnectionId ? [preselectedConnectionId] : []
  );
  const [eventDate, setEventDate] = useState("");
  const [spaceId, setSpaceId] = useState("");
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
          spaceId: spaceId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      // Navigate back to the connection or moments list
      if (preselectedConnectionId) {
        router.push(`/${orgSlug}/connections/${preselectedConnectionId}`);
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
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm"
        >
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="content"
          className="text-bark block text-sm font-medium"
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
          className="border-border text-bark placeholder:text-muted-light focus:border-terracotta focus:ring-terracotta mt-1 block w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-1 focus:outline-none"
        />
        <p className="text-muted mt-1 text-xs">Press Cmd+Enter to submit</p>
      </div>

      <MomentUnderstandingPanel
        content={content}
        organisationId={organisationId}
        onConnectionsMatched={(ids) =>
          setSelectedConnectionIds((prev) => [...new Set([...prev, ...ids])])
        }
        onEventDateDetected={(date) =>
          setEventDate(
            (prev) => prev || (date ? date.toISOString().slice(0, 10) : prev)
          )
        }
      />

      <div>
        <label className="text-bark block text-sm font-medium">
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
          className="text-bark block text-sm font-medium"
        >
          When did this happen?
        </label>
        <input
          id="eventDate"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="border-border text-bark focus:border-terracotta focus:ring-terracotta mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-1 focus:outline-none"
        />
        <p className="text-muted mt-1 text-xs">
          Defaults to when you record it, if left blank.
        </p>
      </div>

      {spaces.length > 0 && (
        <div>
          <label
            htmlFor="spaceId"
            className="text-bark block text-sm font-medium"
          >
            Space
          </label>
          <select
            id="spaceId"
            value={spaceId}
            onChange={(e) => setSpaceId(e.target.value)}
            className="border-border text-bark focus:border-terracotta focus:ring-terracotta mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:ring-1 focus:outline-none"
          >
            <option value="">No space</option>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-terracotta hover:bg-terracotta-dark w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Recording..." : "Record moment"}
      </button>
    </form>
  );
}
