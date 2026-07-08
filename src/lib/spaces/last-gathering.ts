/** "last gathering 2d ago" — a human label for a space's most recent moment. */
export function lastGatheringLabel(date: Date | null): string {
  if (!date) return "no gatherings yet";
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "last gathering today";
  if (days === 1) return "last gathering yesterday";
  if (days < 7) return `last gathering ${days}d ago`;
  if (days < 30) return `last gathering ${Math.round(days / 7)}w ago`;
  return `last gathering ${Math.round(days / 30)}mo ago`;
}
