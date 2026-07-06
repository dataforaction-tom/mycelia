"use client";

import { useState } from "react";
import type { MomentUnderstanding } from "@/lib/ai/moment-understanding";

interface MomentUnderstandingPanelProps {
  content: string;
  organisationId: string;
  onConnectionsMatched: (ids: string[]) => void;
  onEventDateDetected: (date: Date | null) => void;
}

export function MomentUnderstandingPanel({
  content,
  organisationId,
  onConnectionsMatched,
  onEventDateDetected,
}: MomentUnderstandingPanelProps) {
  const [isUnderstanding, setIsUnderstanding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MomentUnderstanding | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  async function handleUnderstand() {
    setIsUnderstanding(true);
    setError(null);

    try {
      const res = await fetch("/api/moments/understand", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organisation-id": organisationId,
        },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setResult(data.data);
      if (data.data.eventDate) {
        onEventDateDetected(new Date(data.data.eventDate));
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setIsUnderstanding(false);
    }
  }

  function handleAdd(id: string) {
    setAddedIds((prev) => new Set(prev).add(id));
    onConnectionsMatched([id]);
  }

  const matched = result?.entities.filter((e) => e.connectionId) ?? [];
  const unmatched = result?.entities.filter((e) => !e.connectionId) ?? [];

  return (
    <div className="rounded-lg border border-border bg-cream p-4">
      <button
        type="button"
        onClick={handleUnderstand}
        disabled={!content.trim() || isUnderstanding}
        className="rounded-lg border border-terracotta px-3 py-1.5 text-sm font-medium text-terracotta transition-colors hover:bg-terracotta/10 disabled:opacity-50"
      >
        {isUnderstanding ? "Understanding…" : "Understand with AI"}
      </button>

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}

      {result && (
        <div className="mt-4 space-y-4 text-sm">
          {matched.length > 0 && (
            <div>
              <p className="font-medium text-bark-light">
                Connections mentioned
              </p>
              <div className="mt-1.5 space-y-1">
                {matched.map((entity) => {
                  const added = addedIds.has(entity.connectionId!);
                  return (
                    <label
                      key={entity.connectionId}
                      className="flex items-center gap-2 text-bark"
                    >
                      <input
                        type="checkbox"
                        checked={added}
                        disabled={added}
                        onChange={() => handleAdd(entity.connectionId!)}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                      {entity.name}
                      {added && (
                        <span className="text-xs text-muted">Added</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {unmatched.length > 0 && (
            <p className="text-muted">
              Mentioned but not in your network yet:{" "}
              {unmatched.map((e) => e.name).join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
