const RECOVERY_WINDOW_MS = 15 * 60 * 1000;

/**
 * True when the current session's token was minted by a magic-link sign-in
 * within the last 15 minutes. A magic link proves inbox ownership — that's
 * exactly what a "forgot password" reset needs, so a session this fresh is
 * treated as authorisation to set a new password without the old one.
 * Bounded to a short window so a long-lived stolen session (JWT sessions
 * last 30 days by default) can't ride an old magic-link sign-in to bypass
 * the current-password check indefinitely.
 */
export function wasRecentlyVerifiedByEmail(
  session: { authProvider?: string; authTime?: number } | null | undefined,
): boolean {
  if (!session?.authProvider || !session.authTime) return false;
  return (
    session.authProvider === "resend" &&
    Date.now() - session.authTime < RECOVERY_WINDOW_MS
  );
}
