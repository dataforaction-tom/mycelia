"use client";

import { useState } from "react";

/**
 * Triggers an authenticated export download. A plain <a download> can't send
 * the required x-organisation-id header, so we fetch with the header, read the
 * response as a blob, and download it via a temporary object URL.
 */
export function ExportButton({
  url,
  organisationId,
  fallbackFilename,
  label = "Export",
}: {
  url: string;
  organisationId: string;
  fallbackFilename: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        headers: { "x-organisation-id": organisationId },
      });
      if (!res.ok) {
        setError("Export failed");
        return;
      }
      // Prefer the server's Content-Disposition filename; fall back otherwise.
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? fallbackFilename;
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
    } catch {
      setError("Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        aria-busy={busy}
        className="border-border bg-surface text-bark hover:bg-cream-dark inline-flex w-fit items-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Preparing…" : label}
      </button>
      {error && (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      )}
    </div>
  );
}
