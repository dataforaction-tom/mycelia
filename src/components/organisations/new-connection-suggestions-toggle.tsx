"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "opt_in" | "opt_out";

const OPTIONS: { value: Mode; label: string; hint: string }[] = [
  {
    value: "opt_in",
    label: "Ask before adding",
    hint: "Suggestions start unselected — you confirm each one.",
  },
  {
    value: "opt_out",
    label: "Pre-select to add",
    hint: "Suggestions start selected — added unless you remove them.",
  },
];

/**
 * Admin control for the org-level `newConnectionSuggestions` preference,
 * which governs whether the moment composer's "add new connection" chips
 * start selected. Persists via the org settings PATCH route.
 */
export function NewConnectionSuggestionsToggle({
  organisationId,
  value,
}: {
  organisationId: string;
  value: Mode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateMode(next: Mode) {
    if (next === mode || isSubmitting) return;

    const previous = mode;
    setMode(next);
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/organisations/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-organisation-id": organisationId,
        },
        body: JSON.stringify({ newConnectionSuggestions: next }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong");
        setMode(previous);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong");
      setMode(previous);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="border-border space-y-3 border-t pt-6">
      <div>
        <h2 className="text-bark text-sm font-semibold">
          New connections in moments
        </h2>
        <p className="text-muted mt-1 text-sm">
          When a moment mentions someone who isn&apos;t a connection yet, how
          should the composer treat the suggestion?
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm"
        >
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = mode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => updateMode(option.value)}
              disabled={isSubmitting}
              aria-pressed={selected}
              className={`rounded-lg border p-4 text-left transition-colors disabled:opacity-60 ${
                selected
                  ? "border-terracotta bg-terracotta/5 ring-terracotta ring-1"
                  : "border-border hover:border-terracotta/50 bg-white"
              }`}
            >
              <span className="text-bark block text-sm font-medium">
                {option.label}
              </span>
              <span className="text-muted mt-1 block text-xs">
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
