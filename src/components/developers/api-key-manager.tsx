"use client";

import { useCallback, useEffect, useState } from "react";

type Scope = "read" | "read_write";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scope: Scope;
  lastUsedAt: string | null;
  createdByEmail: string;
  createdAt: string;
}

interface ApiKeyManagerProps {
  organisationId: string;
}

const SCOPE_LABELS: Record<Scope, string> = {
  read: "Read only",
  read_write: "Read & write",
};

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-bark placeholder:text-muted focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta";
const primaryButtonClass =
  "rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-dark disabled:opacity-50";

export function ApiKeyManager({ organisationId }: ApiKeyManagerProps) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Create-key form state.
  const [name, setName] = useState("");
  const [scope, setScope] = useState<Scope>("read");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // The freshly created secret, shown once until dismissed.
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);

  const headers = { "x-organisation-id": organisationId };

  const loadKeys = useCallback(async () => {
    setListError(null);
    try {
      const res = await fetch("/api/api-keys", { headers });
      const data = await res.json();
      if (!res.ok) {
        setListError(data.error ?? "Couldn't load API keys");
        return;
      }
      setKeys(data.data.items as ApiKey[]);
    } catch {
      setListError("Couldn't load API keys");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organisationId]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  async function handleCreate(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setCreating(true);
    setFormError(null);
    setNewSecret(null);
    setCopied(false);

    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ name, scope }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Couldn't create API key");
        return;
      }
      setNewSecret(data.data.secret as string);
      setName("");
      setScope("read");
      await loadKeys();
    } catch {
      setFormError("Couldn't create API key");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(key: ApiKey) {
    if (
      !window.confirm(
        `Revoke the API key "${key.name}"? Any integration using it will stop working immediately. This can't be undone.`
      )
    ) {
      return;
    }
    setBusyId(key.id);
    setListError(null);
    try {
      const res = await fetch(`/api/api-keys/${key.id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        setListError(data.error ?? "Couldn't revoke API key");
        return;
      }
      await loadKeys();
    } catch {
      setListError("Couldn't revoke API key");
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
        <div className="rounded-xl border border-amber/40 bg-amber/10 p-4">
          <p className="text-sm font-semibold text-bark">
            Copy this key now — it won&apos;t be shown again
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg border border-border bg-white px-3 py-2 font-mono text-xs text-bark">
              {newSecret}
            </code>
            <button
              type="button"
              onClick={copySecret}
              className="shrink-0 rounded-lg border border-border bg-white px-3 py-2 text-sm text-bark hover:bg-cream"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setNewSecret(null)}
            className="mt-3 text-xs text-muted hover:text-bark"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Existing keys. */}
      <section className="space-y-3">
        {listError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {listError}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : keys.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
            <p className="text-sm text-muted">
              No API keys yet. Create one below to authenticate API requests.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {keys.map((key) => (
              <li
                key={key.id}
                className="rounded-xl border border-border bg-surface p-4 shadow-lift"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-bark">
                        {key.name}
                      </p>
                      <span className="rounded-full bg-moss/15 px-2 py-0.5 text-xs text-moss">
                        {SCOPE_LABELS[key.scope]}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-sm text-muted">
                      {key.prefix}…
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      {key.lastUsedAt
                        ? `Last used: ${new Date(
                            key.lastUsedAt
                          ).toLocaleString()}`
                        : "Never used"}
                      {" · Created by "}
                      {key.createdByEmail}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleRevoke(key)}
                      disabled={busyId === key.id}
                      className="text-xs text-destructive hover:opacity-80 disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Create key. */}
      <section className="rounded-xl border border-border bg-surface p-5 shadow-lift">
        <h2 className="text-sm font-semibold text-bark">Create key</h2>
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div>
            <label htmlFor="api-key-name" className="mb-1 block text-sm text-bark">
              Name
            </label>
            <input
              id="api-key-name"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Production sync"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="api-key-scope"
              className="mb-1 block text-sm text-bark"
            >
              Scope
            </label>
            <select
              id="api-key-scope"
              value={scope}
              onChange={(event) => setScope(event.target.value as Scope)}
              className={inputClass}
            >
              <option value="read">Read only</option>
              <option value="read_write">Read & write</option>
            </select>
          </div>

          {formError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={creating || name.trim().length === 0}
            className={primaryButtonClass}
          >
            {creating ? "Creating…" : "Create key"}
          </button>
        </form>
      </section>
    </div>
  );
}
