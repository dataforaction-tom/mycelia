/**
 * Retry schedule for failed webhook deliveries, in minutes from the failing
 * attempt: 1m, 10m, 1h, 6h, 24h. After the fifth attempt fails the schedule is
 * exhausted and the delivery is marked dead.
 */
const SCHEDULE_MINUTES = [1, 10, 60, 360, 1440]; // 1m, 10m, 1h, 6h, 24h

/**
 * Given the number of delivery attempts already made, when to retry next —
 * or null when the schedule is exhausted (caller marks the delivery dead).
 */
export function nextRetryAt(attemptsMade: number, now: Date): Date | null {
  const idx = attemptsMade - 1;
  if (idx < 0 || idx >= SCHEDULE_MINUTES.length) return null;
  return new Date(now.getTime() + SCHEDULE_MINUTES[idx] * 60_000);
}
