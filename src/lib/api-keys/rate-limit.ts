export function checkWindow(
  state: { windowStartedAt: Date | null; windowCount: number },
  now: Date,
  limit: number,
  windowMs: number,
): { allowed: boolean; next: { windowStartedAt: Date; windowCount: number } } {
  const { windowStartedAt, windowCount } = state;

  const windowExpired =
    windowStartedAt === null ||
    now.getTime() - windowStartedAt.getTime() > windowMs;

  // Start a fresh window whenever there is no active window or it has expired.
  if (windowExpired) {
    return {
      allowed: true,
      next: { windowStartedAt: now, windowCount: 1 },
    };
  }

  // Otherwise increment within the current window.
  const newCount = windowCount + 1;
  return {
    allowed: newCount <= limit,
    next: { windowStartedAt, windowCount: newCount },
  };
}
