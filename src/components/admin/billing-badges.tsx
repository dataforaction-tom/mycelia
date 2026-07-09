import { Badge } from "@/components/ui/badge";
import type { SubscriptionState } from "@/lib/billing/subscription";

/** Subscription state → badge colour. Active is growth (moss), trialing is
 *  attention (amber), expired is muted (outline). */
export function StateBadge({ state }: { state: SubscriptionState }) {
  const map = {
    active: { variant: "moss", label: "Active" },
    trialing: { variant: "amber", label: "Trialing" },
    expired: { variant: "outline", label: "Expired" },
  } as const;
  const { variant, label } = map[state];
  return <Badge variant={variant}>{label}</Badge>;
}

/** Platform role badge — super_admin stands out, everyone else is plain. */
export function RoleBadge({ role }: { role: "super_admin" | "user" }) {
  if (role === "super_admin") return <Badge variant="amber">Super admin</Badge>;
  return <Badge variant="outline">User</Badge>;
}
