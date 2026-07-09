"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UpcomingConnection {
  id: string;
  name: string;
}

interface UpcomingReminder {
  id: string;
  note: string;
  dueAt: Date;
  connections: UpcomingConnection[];
}

/** "tomorrow", "in 5 days", "in 2 weeks", "14 Aug" — a light due-date label. */
function dueLabel(dueAt: Date): string {
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.round((dueAt.getTime() - Date.now()) / dayMs);
  if (days < 0) return "now due";
  if (days === 0) return "later today";
  if (days === 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;
  if (days < 14) return "in a week";
  if (days < 31) return `in ${Math.round(days / 7)} weeks`;
  return dueAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * Pending follow-up reminders — the ones still waiting on their due date, so a
 * reminder is visible the moment it's planted rather than only when it surfaces
 * as a whisper. Each can be cancelled (dismissed) before it comes due.
 */
export function UpcomingReminders({
  reminders,
  orgSlug,
  organisationId,
}: {
  reminders: UpcomingReminder[];
  orgSlug: string;
  organisationId: string;
}) {
  const router = useRouter();
  // Track cancellations locally so a dismissed reminder disappears immediately
  // and stays gone across the router.refresh() (client state survives it).
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());

  const visible = reminders.filter((reminder) => !cancelledIds.has(reminder.id));
  if (visible.length === 0) return null;

  async function cancel(id: string) {
    setCancelledIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/observations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-organisation-id": organisationId,
        },
        body: JSON.stringify({ status: "dismissed" }),
      });
      if (!res.ok) {
        // Restore the row if the server rejected it.
        setCancelledIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        return;
      }
      router.refresh();
    } catch {
      setCancelledIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <section>
      <h2 className="font-display text-xl text-bark">Upcoming reminders</h2>
      <p className="mt-1 text-sm text-muted">
        Nudges waiting to surface — you&apos;ll be reminded when each comes due
      </p>
      <ul className="mt-4 divide-y divide-border rounded-xl border border-amber/25 bg-gradient-to-br from-amber/[0.06] to-white/80 shadow-lift">
        {visible.map((reminder) => (
          <li
            key={reminder.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3.5"
          >
            <span aria-hidden="true">🔔</span>
            <span className="min-w-0 flex-1 text-sm text-bark">
              {reminder.note}
              {reminder.connections.length > 0 && (
                <span className="text-muted">
                  {" — "}
                  {reminder.connections.map((connection, index) => (
                    <span key={connection.id}>
                      <Link
                        href={`/${orgSlug}/connections/${connection.id}`}
                        className="text-terracotta-dark underline decoration-terracotta/40 decoration-dotted underline-offset-2 hover:decoration-terracotta"
                      >
                        {connection.name}
                      </Link>
                      {index < reminder.connections.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </span>
              )}
            </span>
            <span className="shrink-0 rounded-full bg-amber/15 px-2.5 py-0.5 text-xs font-medium text-amber-dark">
              {dueLabel(reminder.dueAt)}
            </span>
            <button
              type="button"
              onClick={() => cancel(reminder.id)}
              aria-label="Cancel reminder"
              title="Cancel reminder"
              className="shrink-0 text-muted transition-colors hover:text-terracotta-dark"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
