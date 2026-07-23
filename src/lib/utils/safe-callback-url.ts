/**
 * Validate a user-supplied redirect target is a same-app relative path.
 * Guards against the standard bypasses of a naive `startsWith("/")` check:
 * `//evil.com` and `/\evil.com` are both browser-normalised to a
 * protocol-relative URL (`//evil.com`) despite "starting with a single
 * slash", so a leading backslash must be rejected too.
 */
export function safeCallbackUrl(
  raw: string | undefined,
  fallback: string,
): string {
  if (
    raw &&
    raw.startsWith("/") &&
    !raw.startsWith("//") &&
    !raw.startsWith("/\\")
  ) {
    return raw;
  }
  return fallback;
}
