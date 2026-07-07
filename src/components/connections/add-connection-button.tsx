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
          ? "rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-white shadow-lift transition-all hover:bg-terracotta-dark hover:shadow-hover"
          : "rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-bark transition-colors hover:bg-cream-dark"
      }
    >
      {label}
    </button>
  );
}
