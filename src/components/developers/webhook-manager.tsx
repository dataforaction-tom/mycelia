"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The events shown as subscribe checkboxes. Labels are for display only; the
 * values are what the API validates against.
 * follow_up.due is emitted only once the reminder cron lands (separate branch); omit until then.
 */
const SUBSCRIBABLE_EVENTS: { value: string; label: string }[] = [
  { value: "moment.created", label: "Moment created" },
  { value: "connection.created", label: "Connection created" },
  { value: "observation.generated", label: "Observation generated" },
  { value: "quality.shifted", label: "Quality shifted" },
];

interface Endpoint {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  lastDeliveryAt: string | null;
  lastStatus: string | null;
  createdAt: string;
}

interface WebhookManagerProps {
  organisationId: string;
}

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-bark placeholder:text-muted focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta";
const primaryButtonClass =
  "rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-dark disabled:opacity-50";

export function WebhookManager({ organisationId }: WebhookManagerProps) {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Add-endpoint form state.
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // The freshly created secret, shown once until dismissed.
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);

  const headers = { "x-organisation-id": organisationId };

  const loadEndpoints = useCallback(async () => {
    setListError(null);
    try {
      const res = await fetch("/api/webhooks", { headers });
      const data = await res.json();
      if (!res.ok) {
        setListError(data.error ?? "Couldn't load webhooks");
        return;
      }
      setEndpoints(data.data.items as Endpoint[]);
    } catch {
      setListError("Couldn't load webhooks");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organisationId]);

  useEffect(() => {
    loadEndpoints();
  }, [loadEndpoints]);

  function toggleEvent(value: string) {
    setSelectedEvents((current) =>
      current.includes(value)
        ? current.filter((event) => event !== value)
        : [...current, value]
    );
  }

  async function handleCreate(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setCreating(true);
    setFormError(null);
    setNewSecret(null);
    setCopied(false);

    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ url, events: selectedEvents }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Couldn't create webhook");
        return;
      }
      setNewSecret(data.data.secret as string);
      setUrl("");
      setSelectedEvents([]);
      await loadEndpoints();
    } catch {
      setFormError("Couldn't create webhook");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(endpoint: Endpoint) {
    setBusyId(endpoint.id);
    setListError(null);
    try {
      const res = await fetch(`/api/webhooks/${endpoint.id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ active: !endpoint.active }),
      });
      const data = await res.json();
      if (!res.ok) {
        setListError(data.error ?? "Couldn't update webhook");
        return;
      }
      await loadEndpoints();
    } catch {
      setListError("Couldn't update webhook");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(endpoint: Endpoint) {
    if (
      !window.confirm(
        `Delete the webhook for ${endpoint.url}? This can't be undone.`
      )
    ) {
      return;
    }
    setBusyId(endpoint.id);
    setListError(null);
    try {
      const res = await fetch(`/api/webhooks/${endpoint.id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        setListError(data.error ?? "Couldn't delete webhook");
        return;
      }
      await loadEndpoints();
    } catch {
      setListError("Couldn't delete webhook");
    } finally {
      setBusyId(null);
    }
  }

  async function copySecret() {
    if (!newSecret) return;
    try {
      await navigator.clipboard.writeText(newSecret);
      setCopied(true);
    } catch {
      // Clipboard may be unavailable; the secret is still visible to copy.
      setCopied(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* One-time secret callout after a successful create. */}
      {newSecret && (
        <div className="border-amber/40 bg-amber/10 rounded-xl border p-4">
          <p className="text-bark text-sm font-semibold">
            Save this signing secret — it won&apos;t be shown again
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="border-border text-bark flex-1 overflow-x-auto rounded-lg border bg-white px-3 py-2 font-mono text-xs">
              {newSecret}
            </code>
            <button
              type="button"
              onClick={copySecret}
              className="border-border text-bark hover:bg-cream shrink-0 rounded-lg border bg-white px-3 py-2 text-sm"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setNewSecret(null)}
            className="text-muted hover:text-bark mt-3 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Existing endpoints. */}
      <section className="space-y-3">
        {listError && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
            {listError}
          </div>
        )}

        {loading ? (
          <p className="text-muted text-sm">Loading…</p>
        ) : endpoints.length === 0 ? (
          <div className="border-border rounded-xl border border-dashed bg-white p-8 text-center">
            <p className="text-muted text-sm">
              No webhook endpoints yet. Add one below to receive events.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {endpoints.map((endpoint) => (
              <li
                key={endpoint.id}
                className="border-border bg-surface shadow-lift rounded-xl border p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-bark truncate font-mono text-sm">
                      {endpoint.url}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {endpoint.events.map((event) => (
                        <span
                          key={event}
                          className="bg-moss/15 text-moss-dark rounded-full px-2 py-0.5 text-xs"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                    <p className="text-muted mt-2 text-xs">
                      {endpoint.lastStatus
                        ? `Last delivery: ${endpoint.lastStatus}`
                        : "No deliveries yet"}
                      {endpoint.lastDeliveryAt
                        ? ` · ${new Date(
                            endpoint.lastDeliveryAt
                          ).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(endpoint)}
                      disabled={busyId === endpoint.id}
                      className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                        endpoint.active
                          ? "bg-moss/15 text-moss-dark"
                          : "bg-bark/10 text-muted"
                      }`}
                    >
                      {endpoint.active ? "Active" : "Paused"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(endpoint)}
                      disabled={busyId === endpoint.id}
                      className="text-destructive text-xs hover:opacity-80 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Add endpoint. */}
      <section className="border-border bg-surface shadow-lift rounded-xl border p-5">
        <h2 className="text-bark text-sm font-semibold">Add endpoint</h2>
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="webhook-url"
              className="text-bark mb-1 block text-sm"
            >
              Destination URL
            </label>
            <input
              id="webhook-url"
              type="url"
              required
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/webhooks/tending"
              className={inputClass}
            />
          </div>

          <fieldset>
            <legend className="text-bark mb-1 text-sm">Events</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUBSCRIBABLE_EVENTS.map((option) => (
                <label
                  key={option.value}
                  className="text-bark flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(option.value)}
                    onChange={() => toggleEvent(option.value)}
                    className="border-border text-terracotta-dark focus:ring-terracotta h-4 w-4 rounded"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {formError && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={creating || selectedEvents.length === 0}
            className={primaryButtonClass}
          >
            {creating ? "Adding…" : "Add endpoint"}
          </button>
        </form>
      </section>
    </div>
  );
}
