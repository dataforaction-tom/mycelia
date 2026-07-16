"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GeneratePatternsButton({
  organisationId,
}: {
  organisationId: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/observations/generate", {
        method: "POST",
        headers: { "x-organisation-id": organisationId },
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting}
        className="bg-terracotta hover:bg-terracotta-dark rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Checking…" : "Check for patterns"}
      </button>
      {error && (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
