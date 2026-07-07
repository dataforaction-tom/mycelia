"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Removes exactly the rows seeded at sign-up (recorded ids) — anything the
 * team created themselves is untouched. Shown only while demo data exists.
 */
export function ClearDemoData({ organisationId }: { organisationId: string }) {
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClear() {
    setIsClearing(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/organisations/${organisationId}/onboarding`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "clear-demo" }),
        },
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber/30 bg-amber/5 p-4">
      <p className="text-sm font-medium text-bark">Example data</p>
      <p className="mt-1 text-xs text-muted">
        Your organisation still contains the example network from sign-up.
        Clearing removes only those seeded connections, moments and spaces —
        everything your team added is kept.
      </p>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <button
        type="button"
        onClick={handleClear}
        disabled={isClearing}
        className="mt-3 rounded-full border border-amber/40 px-4 py-1.5 text-xs font-medium text-amber-dark transition-colors hover:bg-amber/10 disabled:opacity-50"
      >
        {isClearing ? "Clearing…" : "Clear example data"}
      </button>
    </div>
  );
}
