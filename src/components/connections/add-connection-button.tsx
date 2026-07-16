"use client";

import { useMomentComposer } from "@/components/moments/moment-composer-context";

/** Opens the "Begin a thread" modal — the only way to add a connection. */
export function AddConnectionButton({
  variant = "primary",
  label = "Add connection",
}: {
  variant?: "primary" | "quiet";
  label?: string;
}) {
  const { openConnectionComposer } = useMomentComposer();

  return (
    <button
      type="button"
      onClick={openConnectionComposer}
      className={
        variant === "primary"
          ? "bg-terracotta shadow-lift hover:bg-terracotta-dark hover:shadow-hover rounded-lg px-4 py-2 text-sm font-medium text-white transition-all"
          : "border-border bg-surface text-bark hover:bg-cream-dark rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
      }
    >
      {label}
    </button>
  );
}
