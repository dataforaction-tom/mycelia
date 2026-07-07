"use client";

import { useMomentComposer } from "./moment-composer-context";

interface ComposerTriggerBarProps {
  /** "pill" for the compact dashboard header trigger; "bar" for a full-width row. */
  variant?: "pill" | "bar";
}

export function ComposerTriggerBar({
  variant = "bar",
}: ComposerTriggerBarProps) {
  const { openComposer } = useMomentComposer();

  return (
    <button
      type="button"
      onClick={() => openComposer()}
      className={
        variant === "pill"
          ? "flex min-w-[280px] items-center gap-2.5 rounded-full border border-border bg-white px-4 py-2.5 shadow-lift transition-shadow hover:shadow-hover"
          : "flex w-full items-center gap-2.5 rounded-2xl border border-border bg-white px-5 py-3.5 shadow-lift transition-shadow hover:shadow-hover"
      }
    >
      <span className="animate-glow h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-terracotta to-moss" />
      <span className="text-sm text-muted-light">
        {variant === "pill"
          ? "What happened today?"
          : "What happened today? Write it as you'd tell a colleague…"}
      </span>
    </button>
  );
}
