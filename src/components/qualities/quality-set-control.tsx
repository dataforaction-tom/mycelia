"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SpectrumKey } from "@/lib/config/qualities";

interface QualitySetControlProps {
  connectionId: string;
  organisationId: string;
  spectrum: SpectrumKey;
  initialPosition: number;
}

export function QualitySetControl({
  connectionId,
  organisationId,
  spectrum,
  initialPosition,
}: QualitySetControlProps) {
  const router = useRouter();
  const [position, setPosition] = useState(initialPosition);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/connections/${connectionId}/qualities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organisation-id": organisationId,
        },
        body: JSON.stringify({ spectrum, position }),
      });

      const data = await res.json();

      if (!res.ok) {
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
    <div className="mt-2 flex items-center gap-2">
      <input
        type="range"
        min={-1}
        max={1}
        step={0.1}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="quality-slider accent-green h-1.5 w-full cursor-pointer"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="border-border bg-surface text-bark hover:border-terracotta/40 hover:text-terracotta-dark shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Save"}
      </button>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
