"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface ToggleChipProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  /** "light" for the parchment shell, "dark" for soil panels. */
  variant?: "light" | "dark";
  /**
   * ARIA role. "switch" (default) for an independent on/off toggle; "radio"
   * for one option in a mutually-exclusive group — the caller must then wrap
   * the chips in a labelled `role="radiogroup"` container so screen readers
   * announce the group and each option's selected state.
   */
  role?: "switch" | "radio";
}

/**
 * A pill-shaped toggle filter — the shared shape behind "Everyone / People /
 * Organisations" style chip rows. Replaces raw checkboxes so filter UI reads
 * the same across the network, moments and connection-story screens.
 */
function ToggleChip({
  pressed,
  onPressedChange,
  variant = "light",
  role = "switch",
  className,
  children,
  ...props
}: ToggleChipProps) {
  const lightPressed =
    "bg-white border-moss/30 text-bark shadow-lift font-semibold";
  const lightUnpressed =
    "border-border text-muted hover:text-bark hover:bg-white/60";
  const darkPressed = "bg-spore/15 border-spore/35 text-soil-ink font-semibold";
  const darkUnpressed =
    "border-soil-line text-soil-ink-soft hover:text-soil-ink";

  return (
    <button
      type="button"
      role={role}
      aria-checked={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
        variant === "dark"
          ? pressed
            ? darkPressed
            : darkUnpressed
          : pressed
            ? lightPressed
            : lightUnpressed,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export { ToggleChip };
