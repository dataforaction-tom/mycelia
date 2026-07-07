/**
 * Vitality: how alive a connection is, from its most recent moment.
 * Kept free of d3 imports so server components (cards, lists) can use it;
 * the D3 canvases pull it in via living.ts.
 */

export type Vitality = "fresh" | "active" | "fading" | "dormant";

export function vitalityOf(lastMomentAt: string | Date | null): Vitality {
  if (!lastMomentAt) return "dormant";
  const then = new Date(lastMomentAt).getTime();
  const days = (Date.now() - then) / (24 * 60 * 60 * 1000);
  if (days <= 7) return "fresh";
  if (days <= 30) return "active";
  if (days <= 90) return "fading";
  return "dormant";
}

export const VITALITY_OPACITY: Record<Vitality, number> = {
  fresh: 1,
  active: 0.95,
  fading: 0.6,
  dormant: 0.35,
};

/** A human sentence about the connection's rhythm, for cards and lists. */
export function vitalityLabel(lastMomentAt: string | Date | null): string {
  if (!lastMomentAt) return "No moments yet";
  const days = Math.floor(
    (Date.now() - new Date(lastMomentAt).getTime()) / (24 * 60 * 60 * 1000)
  );
  if (days <= 7) return "Active this week";
  if (days <= 30) return "Active this month";
  if (days <= 90) return `Quiet for ${Math.max(2, Math.round(days / 7))} weeks`;
  const months = Math.round(days / 30);
  return `Dormant · ${months} ${months === 1 ? "month" : "months"} quiet`;
}
