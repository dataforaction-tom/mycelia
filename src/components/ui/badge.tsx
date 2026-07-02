import * as React from "react";
import { cn } from "@/lib/utils/cn";

const badgeVariants = {
  default: "bg-terracotta text-white",
  moss: "bg-moss text-white",
  amber: "bg-amber text-white",
  sky: "bg-sky text-white",
  bark: "bg-bark text-white",
  outline: "border border-border text-bark bg-transparent",
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
        className,
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
