"use client";

import { useState } from "react";
import { QUALITY_SPECTRUMS } from "@/lib/config/qualities";
import type { MomentUnderstanding } from "@/lib/ai/moment-understanding";

interface Connection {
  id: string;
  name: string;
  type: string;
}

interface MomentUnderstandingPanelProps {
  content: string;
  organisationId: string;
  existingConnections: Connection[];
  onConnectionsMatched: (ids: string[]) => void;
  onEventDateDetected: (date: Date | null) => void;
}

export function MomentUnderstandingPanel({
  content,
  organisationId,
  existingConnections,
  onConnectionsMatched,
  onEventDateDetected,
}: MomentUnderstandingPanelProps) {
  const [isUnderstanding, setIsUnderstanding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MomentUnderstanding | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [signalState, setSignalState] = useState<
    Record<number, "idle" | "applying" | "applied" | "error">
  >({});

  const connectionName = (id: string) =>
    existingConnections.find((c) => c.id === id)?.name ?? "Unknown";

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

  async function handleApplySignal(
    index: number,
    connectionId: string,
    spectrum: string,
    position: number
  ) {
    setSignalState((prev) => ({ ...prev, [index]: "applying" }));

    try {
      const res = await fetch(`/api/connections/${connectionId}/qualities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organisation-id": organisationId,
        },
        body: JSON.stringify({ spectrum, position }),
      });

      if (!res.ok) {
        setSignalState((prev) => ({ ...prev, [index]: "error" }));
        return;
      }

      setSignalState((prev) => ({ ...prev, [index]: "applied" }));
    } catch {
      setSignalState((prev) => ({ ...prev, [index]: "error" }));
    }
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

          {result.qualitySignals.length > 0 && (
            <div>
              <p className="font-medium text-bark-light">
                Suggested qualities
              </p>
              <div className="mt-1.5 space-y-2">
                {result.qualitySignals.map((signal, index) => {
                  const config =
                    QUALITY_SPECTRUMS[
                      signal.spectrum as keyof typeof QUALITY_SPECTRUMS
                    ];
                  const state = signalState[index] ?? "idle";
                  const direction =
                    signal.position >= 0 ? config.high : config.low;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-bark">
                        {connectionName(signal.connectionId)} — {config.label}
                        : {direction}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleApplySignal(
                            index,
                            signal.connectionId,
                            signal.spectrum,
                            signal.position
                          )
                        }
                        disabled={state === "applying" || state === "applied"}
                        className="shrink-0 rounded-lg bg-moss px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50"
                      >
                        {state === "applying"
                          ? "Applying…"
                          : state === "applied"
                            ? "Applied"
                            : state === "error"
                              ? "Retry"
                              : "Apply"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
