import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { ConnectionType } from "@/lib/config/theme";

// One source of truth for connection-type coloring, built on
// CONNECTION_TYPE_COLORS' hue families. Previously duplicated verbatim in
// MomentCard, ObservationCard and the connection detail page.
const TYPE_CLASSES: Record<string, string> = {
  person: "bg-moss/15 text-moss-dark",
  organisation: "bg-terracotta/10 text-terracotta-dark",
  group: "bg-green/10 text-green-dark",
  community: "bg-amber/15 text-amber-dark",
};

export interface ConnectionTypeBadgeProps extends Omit<BadgeProps, "variant"> {
  type: ConnectionType | string;
}

function ConnectionTypeBadge({
  type,
  className,
  ...props
}: ConnectionTypeBadgeProps) {
  return (
    <Badge
      className={`${TYPE_CLASSES[type] ?? ""} ${className ?? ""}`}
      {...props}
    />
  );
}

export { ConnectionTypeBadge };
