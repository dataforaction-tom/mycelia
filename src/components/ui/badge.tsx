import * as React from "react";
import { cn } from "@/lib/utils/cn";

// Solid badges carry white text, so the fills use the -dark accent tokens
// (each ≥4.5:1 with white) rather than the lighter base accents, which sat
// at ~2.7–3.3:1 and failed WCAG AA.
const badgeVariants = {
  default: "bg-terracotta-dark text-white",
  moss: "bg-moss-dark text-white",
  amber: "bg-amber-dark text-white",
  sky: "bg-sky-dark text-white",
  bark: "bg-bark text-white",
  outline: "border border-border-strong text-bark bg-transparent",
} as const;

type BadgeVariant = keyof typeof badgeVariants;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
