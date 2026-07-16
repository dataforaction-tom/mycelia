"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { FeedbackStatus, FeedbackPriority } from "@/lib/admin/feedback";

const STATUS_OPTIONS: FeedbackStatus[] = [
  "new",
  "triaged",
  "planned",
  "in_progress",
  "done",
  "declined",
];
const PRIORITY_OPTIONS: FeedbackPriority[] = ["low", "medium", "high"];

const SELECT_CLASS =
  "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-bark focus:outline-none focus:ring-2 focus:ring-terracotta";

interface FeedbackTriageProps {
  id: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  adminNotes: string | null;
}

export function FeedbackTriage({
  id,
  status: initialStatus,
  priority: initialPriority,
  adminNotes: initialNotes,
}: FeedbackTriageProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState(initialPriority);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    status !== initialStatus ||
    priority !== initialPriority ||
    notes !== (initialNotes ?? "");

  async function save() {
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status,
          priority,
          adminNotes: notes.trim() === "" ? null : notes,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setError(json.error ?? "Could not save");
        return;
      }
      setNotice("Saved.");
      router.refresh();
    } catch {
      setError("Network error — please retry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="border-moss/30 bg-moss/10 text-bark rounded-lg border px-3 py-2 text-sm"
        >
          {notice}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className={SELECT_CLASS}
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as FeedbackStatus)
            }
          >
            {STATUS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            className={SELECT_CLASS}
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as FeedbackPriority)
            }
          >
            {PRIORITY_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Internal notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes for triage (not shown to the submitter)…"
          rows={3}
        />
      </div>

      <Button size="sm" onClick={save} disabled={saving || !dirty}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
